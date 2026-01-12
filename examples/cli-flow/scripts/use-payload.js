const fs = require("fs");

const payload = process.argv[2];
if (!payload) {
  console.error("payload required");
  process.exit(1);
}

fs.writeFileSync("final.txt", payload, "utf-8");
console.log(`final-bytes=${payload.length}`);
