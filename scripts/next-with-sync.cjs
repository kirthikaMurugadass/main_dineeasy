/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function isNumericChunk(fileName) {
  return /^\d+\.js$/.test(fileName);
}

function removeServerRootNumericChunks(projectRoot, distDirName) {
  const serverDir = path.join(projectRoot, distDirName, "server");
  if (!fs.existsSync(serverDir)) return;

  let entries;
  try {
    entries = fs.readdirSync(serverDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const ent of entries) {
    if (!ent.isFile()) continue;
    if (!isNumericChunk(ent.name)) continue;
    try {
      fs.unlinkSync(path.join(serverDir, ent.name));
    } catch {
      // ignore transient file locks during rebuilds
    }
  }
}

function clearStaleServerBuild(projectRoot, distDirName) {
  const serverDir = path.join(projectRoot, distDirName, "server");
  if (!fs.existsSync(serverDir)) return;
  try {
    fs.rmSync(serverDir, { recursive: true, force: true });
  } catch {
    // ignore transient file locks on Windows
  }
}

function syncServerChunksOnce(projectRoot, distDirName) {
  const serverDir = path.join(projectRoot, distDirName, "server");
  const chunksDir = path.join(serverDir, "chunks");

  if (!fs.existsSync(serverDir) || !fs.existsSync(chunksDir)) return;

  let entries;
  try {
    entries = fs.readdirSync(chunksDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const ent of entries) {
    if (!ent.isFile()) continue;
    if (!isNumericChunk(ent.name)) continue;

    const src = path.join(chunksDir, ent.name);
    const dest = path.join(serverDir, ent.name);

    try {
      const srcStat = fs.statSync(src);
      const destStat = fs.existsSync(dest) ? fs.statSync(dest) : null;
      if (!destStat || srcStat.mtimeMs > destStat.mtimeMs) {
        fs.copyFileSync(src, dest);
      }
    } catch {
      // ignore transient file locks during rebuilds
    }
  }
}

function main() {
  const projectRoot = process.cwd();
  const mode = process.argv[2] || "dev"; // "dev" | "start"
  const restArgs = process.argv.slice(3);
  const distDirName = mode === "dev" ? ".next-dev" : ".next";

  // If present, prefer a preload hook that rewrites numeric chunk requires to `.next/server/chunks/`
  // to avoid stale/partial copies during Fast Refresh on Windows.
  const preloadHook = path.join(projectRoot, "scripts", "next-chunk-resolver.cjs");
  const hasPreloadHook = process.platform === "win32" && fs.existsSync(preloadHook);

  const prevNodeOptions = process.env.NODE_OPTIONS || "";
  const preloadArg = `--require ${preloadHook}`;

  // Remove stale references (in case the hook was deleted/moved previously)
  const cleanedNodeOptions = prevNodeOptions
    .split(/\s+/)
    .filter(Boolean)
    .filter((tok, idx, arr) => {
      // drop "--require <missingfile>" pairs specifically for our hook
      if (tok === "--require" && arr[idx + 1] && arr[idx + 1].includes("next-chunk-resolver.cjs")) {
        const file = arr[idx + 1].replace(/^["']|["']$/g, "");
        return fs.existsSync(file);
      }
      if (tok.includes("next-chunk-resolver.cjs") && !fs.existsSync(tok.replace(/^["']|["']$/g, ""))) {
        return false;
      }
      return true;
    })
    .join(" ");

  const nextNodeOptions = hasPreloadHook
    ? (cleanedNodeOptions.includes(preloadArg) ? cleanedNodeOptions : `${cleanedNodeOptions} ${preloadArg}`.trim())
    : cleanedNodeOptions;

  // In dev mode, stale server artifacts are the most common source of webpack runtime
  // module-shape errors on Windows (`__webpack_modules__[moduleId] is not a function`).
  // Clearing only `.next/server` keeps startup stable without deleting full Next cache.
  if (mode === "dev") {
    clearStaleServerBuild(projectRoot, distDirName);
  }

  // sync once before start only when the preload hook is NOT active.
  // On Windows with the hook, copied root chunks can become stale and trigger
  // runtime errors like "Cannot read properties of undefined (reading 'call')".
  if (hasPreloadHook) {
    removeServerRootNumericChunks(projectRoot, distDirName);
  } else {
    syncServerChunksOnce(projectRoot, distDirName);
  }

  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, mode, ...restArgs], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: nextNodeOptions,
      NEXT_DIST_DIR: distDirName,
    },
  });

  // If the preload hook is active, avoid background copying to prevent stale chunk duplication.
  const interval = hasPreloadHook
    ? null
    : setInterval(() => syncServerChunksOnce(projectRoot, distDirName), 1200);

  const cleanup = (code) => {
    if (interval) clearInterval(interval);
    process.exit(typeof code === "number" ? code : 0);
  };

  child.on("exit", (code) => cleanup(code));
  child.on("error", () => cleanup(1));

  process.on("SIGINT", () => {
    try {
      child.kill("SIGINT");
    } catch {}
    cleanup(0);
  });
}

main();

