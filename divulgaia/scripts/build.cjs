const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const output = path.resolve(root, "../dist");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))
  new vm.Script(match[1]);
new vm.Script(fs.readFileSync(path.join(root, "agent.js"), "utf8"));
for (const file of ["experience.js", "safety.js", "local-tools.js", "premium.js", "marketing.js"])
  new vm.Script(fs.readFileSync(path.join(root, file), "utf8"));
new vm.Script(fs.readFileSync(path.join(root, "../server.cjs"), "utf8"));
fs.mkdirSync(output, { recursive: true });
for (const file of [
  "index.html",
  "agent.js",
  "agent.css",
  "premium.css",
  "premium.js",
  "experience.js",
  "safety.js",
  "local-tools.js",
  "marketing.js",
])
  fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.cpSync(path.join(root, "assets"), path.join(output, "assets"), {
  recursive: true,
});
console.log(
  "Production build ready in dist/ (standalone static app, local fonts).",
);
