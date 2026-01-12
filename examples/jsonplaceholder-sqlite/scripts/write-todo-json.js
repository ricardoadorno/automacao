const fs = require("fs");

const filename = process.argv[2] || "todo.json";
const todoId = process.argv[3];
const todoTitle = process.argv[4];
const todoCompleted = process.argv[5];

if (!todoId || !todoTitle || todoCompleted === undefined) {
  console.error("todoId, todoTitle, todoCompleted required");
  process.exit(1);
}

const payload = {
  id: Number(todoId),
  title: todoTitle,
  completed: String(todoCompleted).toLowerCase() === "true"
};

const raw = JSON.stringify(payload);
fs.writeFileSync(filename, raw, "utf-8");

console.log(
  JSON.stringify({
    file: filename,
    bytes: Buffer.byteLength(raw, "utf-8")
  })
);
