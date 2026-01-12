const fs = require("fs");
const path = require("path");

const sourcePath = process.argv[2];
const destName = process.argv[3] || "downloaded.csv";

if (!sourcePath) {
  console.error("sourcePath required");
  process.exit(1);
}

const absSource = path.resolve(sourcePath);
const data = fs.readFileSync(absSource, "utf-8");
fs.writeFileSync(destName, data, "utf-8");
console.log(`saved=${destName}`);
