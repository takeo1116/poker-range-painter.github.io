const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
function check(directory) {
  for (const file of fs.readdirSync(directory)) {
    const absolute = path.join(directory, file);
    if (fs.statSync(absolute).isDirectory()) check(absolute);
    else if (/\.(js|css|html)$/.test(file) &&
      /reference-editor|LOCAL DEVELOPMENT ONLY|range-painter\.reference-editor/.test(fs.readFileSync(absolute, "utf8"))) {
      throw new Error("Development editor found in production: " + absolute);
    }
  }
}
check(root);
console.log("Production check passed: development editor excluded");
