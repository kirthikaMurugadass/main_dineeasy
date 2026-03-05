/* eslint-disable no-underscore-dangle */
/**
 * next-chunk-resolver.cjs
 *
 * Windows mitigation for Next.js dev/start where `.next/server/webpack-runtime.js`
 * may `require("./1234.js")` but the numeric chunk actually lives in `.next/server/chunks/1234.js`.
 *
 * Using a copy loop can leave stale/partial chunk copies during Fast Refresh, causing:
 * - TypeError: Cannot read properties of undefined (reading 'call')
 * - TypeError: __webpack_modules__[moduleId] is not a function
 *
 * This hook rewrites numeric chunk requires to load from the `chunks/` directory directly.
 */

const fs = require("fs");
const path = require("path");
const Module = require("module");

const originalLoad = Module._load;

function isNumericChunkRequest(req) {
  return typeof req === "string" && /^(?:\.\/|\.\.\/)\d+\.js$/.test(req);
}

function isInsideNextServer(filename) {
  return typeof filename === "string" && filename.includes(path.join(".next", "server"));
}

Module._load = function patchedLoad(request, parent, isMain) {
  if (isNumericChunkRequest(request) && parent && isInsideNextServer(parent.filename)) {
    const prefix = request.startsWith("../") ? "../" : "./";
    const chunkFile = request.slice(prefix.length); // "1234.js"
    const rewritten = `${prefix}chunks/${chunkFile}`;

    try {
      const abs = path.resolve(path.dirname(parent.filename), rewritten);
      if (fs.existsSync(abs)) {
        return originalLoad.call(this, rewritten, parent, isMain);
      }
    } catch {
      // fall back to normal resolution
    }
  }

  return originalLoad.call(this, request, parent, isMain);
};

