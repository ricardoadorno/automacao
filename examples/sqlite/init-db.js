const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "demo.db");
const db = new Database(dbPath);

db.exec("drop table if exists todos;");
db.exec("create table todos (id integer primary key, title text, run_date text);");
db.exec("insert into todos (id, title, run_date) values (1, 'task-1', '2026-01-10');");
db.exec("insert into todos (id, title, run_date) values (2, 'task-2', '2026-01-11');");

db.close();
console.log(`SQLite database created at ${dbPath}`);
