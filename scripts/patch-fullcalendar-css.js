/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const PACKAGES = [
  "@fullcalendar/core",
  "@fullcalendar/timegrid",
  "@fullcalendar/resource-timegrid",
];

function updatePackage(pkgName) {
  const pkgPath = path.join(process.cwd(), "node_modules", ...pkgName.split("/"));
  const pkgJsonPath = path.join(pkgPath, "package.json");

  if (!fs.existsSync(pkgJsonPath)) {
    console.warn(`[fullcalendar-css] ${pkgName} not found at ${pkgJsonPath}`);
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  let changed = false;

  if (!pkg.exports || typeof pkg.exports !== "object") {
    pkg.exports = {};
    changed = true;
  }

  if (!pkg.exports["./index.css"]) {
    const cssPath = path.join(pkgPath, "index.css");
    if (fs.existsSync(cssPath)) {
      pkg.exports["./index.css"] = "./index.css";
      changed = true;
    } else {
      console.warn(`[fullcalendar-css] ${pkgName} index.css not found`);
    }
  }

  if (pkg.sideEffects === false) {
    pkg.sideEffects = ["*.css"];
    changed = true;
  } else if (Array.isArray(pkg.sideEffects)) {
    if (!pkg.sideEffects.includes("*.css")) {
      pkg.sideEffects = [...pkg.sideEffects, "*.css"];
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  return changed;
}

let touched = 0;
for (const pkgName of PACKAGES) {
  if (updatePackage(pkgName)) {
    touched += 1;
  }
}

if (touched > 0) {
  console.log(`[fullcalendar-css] patched ${touched} package(s)`);
} else {
  console.log("[fullcalendar-css] no changes needed");
}
