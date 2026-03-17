const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

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

function cleanupNextTypesForWindows() {
  if (process.platform !== "win32") return;
  if (process.env.FORCE_CLEAN_NEXT !== "1") return;

  // Workaround: Next.js can crash on Windows/OneDrive with:
  // EINVAL: invalid argument, readlink '.next/...'
  // Clearing stale build artifacts avoids this startup failure.
  // Keep this opt-in so we do not wipe `.next` during normal dev starts.
  const nextDir = path.join(process.cwd(), ".next");
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
  } catch {
    // ignore file lock/transient errors; Next may still start successfully
  }
}

function getLockFilePath() {
  // Keep lock outside `.next` so optional cache cleanup cannot remove it.
  return path.join(process.cwd(), ".dev-server.lock");
}

function isPidRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireDevLock() {
  const lockPath = getLockFilePath();
  if (fs.existsSync(lockPath)) {
    try {
      const payload = JSON.parse(fs.readFileSync(lockPath, "utf8"));
      if (isPidRunning(payload?.pid)) {
        console.error(
          `Another dev server is already running for this project (pid ${payload.pid}). Stop it first, then run npm run dev again.`
        );
        process.exit(1);
      }
    } catch {
      // unreadable/stale lock -> overwrite
    }
  }

  try {
    fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, host: os.hostname() }), "utf8");
  } catch {
    // If lock cannot be created, proceed but without protection.
  }
}

function releaseDevLock() {
  const lockPath = getLockFilePath();
  try {
    if (!fs.existsSync(lockPath)) return;
    const payload = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (payload?.pid === process.pid) {
      fs.rmSync(lockPath, { force: true });
    }
  } catch {
    // ignore cleanup errors
  }
}

acquireDevLock();
cleanupNextTypesForWindows();

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
  releaseDevLock();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  releaseDevLock();
  process.exit(0);
});

process.on("SIGTERM", () => {
  releaseDevLock();
  process.exit(0);
});