const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
}

function ensureServerChunks() {
  const serverDir = path.join(process.cwd(), ".next", "server");
  const chunksDir = path.join(serverDir, "chunks");
  const entries = safeReaddir(chunksDir);
  if (!entries) return;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".js")) continue;

    const src = path.join(chunksDir, entry.name);
    const dest = path.join(serverDir, entry.name);
    if (fs.existsSync(dest)) continue;
    try {
      fs.copyFileSync(src, dest);
    } catch {
      // ignore transient locks
    }
  }
}

// On Windows + newer Node versions, spawning `next.cmd` directly can throw `spawn EINVAL`.
// Running it through `cmd.exe /c` is the most reliable approach.
const child =
  process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", "next dev"], {
        stdio: "inherit",
        windowsHide: true,
      })
    : spawn("next", ["dev"], { stdio: "inherit" });

const interval = setInterval(ensureServerChunks, 1500);
child.on("exit", (code) => {
  clearInterval(interval);
  process.exit(code ?? 0);
});

