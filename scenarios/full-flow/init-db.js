const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "sample.db");
const db = new Database(dbPath);

db.exec("drop table if exists items;");
db.exec("create table items (id integer primary key, name text);");

const insert = db.prepare("insert into items (name) values (?)");
insert.run("alpha");
insert.run("beta");
insert.run("gamma");

db.close();
console.log("SQLite sample.db created");
