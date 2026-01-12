const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2] || "downloaded.csv";
const outputPath = process.argv[3] || "transformed.txt";

const absInput = path.resolve(inputPath);
const raw = fs.readFileSync(absInput, "utf-8").trim();
const lines = raw.split(/\r?\n/);
const header = lines[0] || "";
const dataLines = lines.slice(1);
const upper = dataLines.map((line) => line.toUpperCase()).join("\n");

const payload = `header=${header}\n${upper}\n`;
fs.writeFileSync(outputPath, payload, "utf-8");

const summary = {
  rows: dataLines.length,
  output: outputPath
};
console.log(JSON.stringify(summary));
