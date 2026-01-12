const fs = require("fs");
const path = require("path");

const inputPath = process.argv[2] || "transformed.txt";
const absInput = path.resolve(inputPath);

const data = fs.readFileSync(absInput, "utf-8");
fs.unlinkSync(absInput);

console.log(`payload=${JSON.stringify(data)}`);
