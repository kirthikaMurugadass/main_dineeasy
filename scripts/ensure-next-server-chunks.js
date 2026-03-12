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
  const nextDir = path.join(process.cwd(), ".next");
  const serverDir = path.join(nextDir, "server");
  const chunksDir = path.join(serverDir, "chunks");

  const entries = safeReaddir(chunksDir);
  if (!entries) return;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".js")) continue;

    const src = path.join(chunksDir, entry.name);
    const dest = path.join(serverDir, entry.name);

    // Only copy if missing. If it exists, leave it alone to avoid fighting dev HMR.
    if (fs.existsSync(dest)) continue;

    try {
      fs.copyFileSync(src, dest);
    } catch {
      // Ignore copy failures (e.g. transient file locks on Windows/AV/OneDrive).
    }
  }
}

ensureServerChunks();

