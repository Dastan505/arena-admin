/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("child_process");
const path = require("path");

const FALLBACK_COLUMNS = 120;
const FALLBACK_ROWS = 30;

function normalize(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function ensureTtySize(stream, fallbackColumns, fallbackRows) {
  if (!stream) return;

  const columns = normalize(stream.columns, fallbackColumns);
  const rows = normalize(stream.rows, fallbackRows);

  try {
    Object.defineProperty(stream, "columns", {
      value: columns,
      configurable: true,
      writable: false,
      enumerable: true,
    });
  } catch {
    // Ignore if the runtime disallows overriding.
  }

  try {
    Object.defineProperty(stream, "rows", {
      value: rows,
      configurable: true,
      writable: false,
      enumerable: true,
    });
  } catch {
    // Ignore if the runtime disallows overriding.
  }

  process.env.COLUMNS = String(columns);
  process.env.LINES = String(rows);
}

ensureTtySize(process.stdout, FALLBACK_COLUMNS, FALLBACK_ROWS);
ensureTtySize(process.stderr, FALLBACK_COLUMNS, FALLBACK_ROWS);

const nextBin = path.join(
  __dirname,
  "..",
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);
const guardPath = path.join(__dirname, "repeat-guard.js");

const extraArgs = process.argv.slice(2);
const child = spawn(
  process.execPath,
  ["--require", guardPath, nextBin, "dev", ...extraArgs],
  {
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
