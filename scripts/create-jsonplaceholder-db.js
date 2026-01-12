const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "examples", "jsonplaceholder-sqlite", "jsonplaceholder.db");
const db = new Database(dbPath);

db.exec("drop table if exists todos;");
db.exec("create table todos (id integer primary key, userId integer, title text, completed integer);");
db.exec("insert into todos (id, userId, title, completed) values (1, 1, 'delectus aut autem', 0);");

db.close();
console.log(`SQLite database created at ${dbPath}`);
