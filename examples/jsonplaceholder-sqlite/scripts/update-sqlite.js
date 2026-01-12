const Database = require("better-sqlite3");

const dbPath = process.argv[2];
const payloadText = process.argv[3];

if (!dbPath || !payloadText) {
  console.error("dbPath and payloadText required");
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(payloadText);
} catch (error) {
  console.error("invalid payloadText JSON");
  process.exit(1);
}

const db = new Database(dbPath);
try {
  const update = db.prepare(
    "update todos set title = ?, completed = ? where id = ?"
  );
  const info = update.run(payload.title, payload.completed ? 1 : 0, payload.id);
  if (info.changes === 0) {
    const insert = db.prepare("insert into todos (id, title, completed) values (?, ?, ?)");
    insert.run(payload.id, payload.title, payload.completed ? 1 : 0);
  }
} finally {
  db.close();
}

console.log(
  JSON.stringify({
    updatedId: payload.id,
    title: payload.title
  })
);
