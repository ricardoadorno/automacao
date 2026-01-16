const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "sample.db");
const db = new Database(dbPath);

db.exec("drop table if exists users;");
db.exec("create table users (id integer primary key, name text, active integer);");

const insert = db.prepare("insert into users (name, active) values (?, ?)");
insert.run("Alice", 1);
insert.run("Bob", 0);
insert.run("Carol", 1);

db.close();
console.log("SQLite sample.db created");
