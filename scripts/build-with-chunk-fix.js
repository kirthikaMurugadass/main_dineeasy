const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function cleanupNextForWindows() {
  if (process.platform !== "win32") return;

  // Workaround: Next.js can fail on Windows/OneDrive with:
  // EINVAL: invalid argument, readlink '.next/...'
  const nextDir = path.join(process.cwd(), ".next");
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
  } catch {
    // ignore transient lock errors; build may still succeed
  }
}

function run(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", `${command} ${args.join(" ")}`], {
            stdio: "inherit",
            windowsHide: true,
            cwd,
          })
        : spawn(command, args, { stdio: "inherit", cwd });

    child.on("exit", (code) => {
      if ((code ?? 0) === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function createTempBuildDir(projectRoot) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dineeasy-build-"));
  fs.cpSync(projectRoot, tempRoot, {
    recursive: true,
    filter: (src) => {
      const base = path.basename(src);
      if (base === "node_modules" || base === ".next" || base === ".git") return false;
      return true;
    },
  });

  const sourceNodeModules = path.join(projectRoot, "node_modules");
  const tempNodeModules = path.join(tempRoot, "node_modules");
  fs.symlinkSync(sourceNodeModules, tempNodeModules, "junction");
  return tempRoot;
}

function copyBuildOutput(tempRoot, projectRoot) {
  const tempNextDir = path.join(tempRoot, ".next");
  const projectNextDir = path.join(projectRoot, ".next");
  fs.rmSync(projectNextDir, { recursive: true, force: true });
  fs.cpSync(tempNextDir, projectNextDir, { recursive: true });
}

async function main() {
  const projectRoot = process.cwd();

  if (process.platform !== "win32") {
    await run("next", ["build"], projectRoot);
    await run("node", ["scripts/ensure-next-server-chunks.js"], projectRoot);
    return;
  }

  cleanupNextForWindows();
  const tempRoot = createTempBuildDir(projectRoot);

  try {
    await run("next", ["build"], tempRoot);
    await run("node", ["scripts/ensure-next-server-chunks.js"], tempRoot);
    copyBuildOutput(tempRoot, projectRoot);
  } finally {
    try {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
