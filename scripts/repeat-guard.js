let isMainThread = true;
let threadId = 0;

try {
  const workerThreads = require("worker_threads");
  if (workerThreads && typeof workerThreads.isMainThread === "boolean") {
    isMainThread = workerThreads.isMainThread;
  }
  if (workerThreads && typeof workerThreads.threadId === "number") {
    threadId = workerThreads.threadId;
  }
} catch {
  // worker_threads not available
}

const nativeRepeat = String.prototype.repeat;
let logged = false;

String.prototype.repeat = function repeat(count) {
  const numericCount = Number(count);
  if (Number.isFinite(numericCount) && numericCount < 0) {
    if (!logged) {
      logged = true;
      const err = new Error("String.repeat called with negative count");
      const info = {
        count: numericCount,
        pid: process.pid,
        threadId,
        isMainThread,
        columns: process.stdout && process.stdout.columns,
        rows: process.stdout && process.stdout.rows,
      };
      try {
        console.error("[repeat-guard] negative repeat detected:", info);
        console.error(err.stack);
      } catch {
        // ignore logging errors
      }
    }
    return nativeRepeat.call(this, 0);
  }
  return nativeRepeat.call(this, count);
};
