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

  // sync once before start (useful for `next start`)
  syncServerChunksOnce(projectRoot);

  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, mode, ...restArgs], {
    stdio: "inherit",
    env: process.env,
  });

  // keep syncing in the background (useful for `next dev` rebuilds)
  const interval = setInterval(() => syncServerChunksOnce(projectRoot), 1200);

  const cleanup = (code) => {
    clearInterval(interval);
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

