/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function isNumericChunk(fileName) {
  return /^\d+\.js$/.test(fileName);
}

function syncServerChunksOnce(projectRoot) {
  const serverDir = path.join(projectRoot, ".next", "server");
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

  // sync once before start (useful for `next start` or as a fallback)
  syncServerChunksOnce(projectRoot);

  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, mode, ...restArgs], {
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: nextNodeOptions },
  });

  // If the preload hook is active, avoid background copying to prevent stale chunk duplication.
  const interval = hasPreloadHook ? null : setInterval(() => syncServerChunksOnce(projectRoot), 1200);

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

