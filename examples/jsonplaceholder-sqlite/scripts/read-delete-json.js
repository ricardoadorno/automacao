const fs = require("fs");

const filename = process.argv[2] || "todo.json";
if (!fs.existsSync(filename)) {
  console.error(`file not found: ${filename}`);
  process.exit(1);
}

const raw = fs.readFileSync(filename, "utf-8");
fs.unlinkSync(filename);

console.log(
  JSON.stringify({
    payloadText: raw,
    bytes: Buffer.byteLength(raw, "utf-8")
  })
);
