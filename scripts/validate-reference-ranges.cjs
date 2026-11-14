const fs = require("node:fs");
const path = require("node:path");
const load = require("./load-typescript.cjs");
const root = path.resolve(__dirname, "..");
const { validateReferenceCollection } = load(path.join(root, "src/utils/referenceRanges.ts"));
const directory = path.join(root, "src/data/reference-ranges");
try {
  const files = Object.fromEntries(fs.readdirSync(directory).filter(name => name.endsWith(".json"))
    .map(name => [name, JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"))]));
  const ranges = validateReferenceCollection(files);
  console.log("Validated " + ranges.length + " reference ranges");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
