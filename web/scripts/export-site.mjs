// Builds the homepage as static files and copies them into the static site root (cloud-deploy/).
// The terminal (ashare-quant.html), site/config.js and the other existing files are left untouched.
// Usage (from web/): npm run export-site
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const WEB = process.cwd();
const ROOT = path.resolve(WEB, "..");
const OUT = path.join(WEB, "out");

execSync("npx next build", { stdio: "inherit", cwd: WEB });

// Remove the previous export's build assets so stale chunks do not pile up.
fs.rmSync(path.join(ROOT, "_next"), { recursive: true, force: true });

const SKIP = new Set(["site"]); // dev-only copy of ../site; the real one stays in place
for (const entry of fs.readdirSync(OUT)) {
  if (SKIP.has(entry)) continue;
  fs.cpSync(path.join(OUT, entry), path.join(ROOT, entry), { recursive: true });
}

// Old intro pages now live as sections of the homepage.
const redirect = (target, title) => `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>${title} · Bunnies 量研</title>
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
</head><body><p>页面已合并到首页：<a href="${target}">${target}</a></p></body></html>
`;
const pages = {
  "strategies.html": ["index.html#pricing-section", "策略"],
  "method.html": ["index.html#solutions-section", "方法与治理"],
  "start.html": ["index.html", "终端入口"],
  "desk.html": ["index.html#solutions-section", "研究台"],
};
for (const [file, [target, title]] of Object.entries(pages)) {
  fs.writeFileSync(path.join(ROOT, file), redirect(target, title));
}
console.log("Exported homepage into", ROOT);
