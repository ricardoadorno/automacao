import { promises as fs } from "fs";
import path from "path";
import { chromium } from "playwright";
import DatabaseConstructor from "better-sqlite3";
import mysql, { Connection } from "mysql2/promise";
import { PlanStep } from "../../core/types";

interface SqlEvidenceResult {
  files: string[];
  screenshotPath: string;
  queryFile: string;
  resultFile: string;
  evidenceFile: string;
  rows: number;
  rowsData: Array<Record<string, string>>;
}

interface CsvData {
  headers: string[];
  rows: string[][];
}

type SqliteDatabase = InstanceType<typeof DatabaseConstructor>;
type MysqlConfig = NonNullable<NonNullable<NonNullable<PlanStep["config"]>["sql"]>["mysql"]>;

const sqliteConnections = new Map<string, SqliteDatabase>();
let mysqlConnection: Connection | null = null;
let mysqlConnectionKey = "";

export async function executeSqlEvidenceStep(step: PlanStep, stepDir: string): Promise<SqlEvidenceResult> {
  const sqlConfig = step.config?.sql;
  if (!sqlConfig) {
    throw new Error("sqlEvidence step requires config.sql");
  }

  const adapter = sqlConfig.adapter ?? "files";
  let queryOut = "";
  let resultOut = "";
  let queryFile = "";
  let resultFile = "";
  let resultRaw = "";
  let parsed: ParsedResult;
  let queryText = "";
  const executedAt = new Date().toISOString();

  if (adapter === "sqlite") {
    if (!sqlConfig.dbPath) {
      throw new Error("sqlite adapter requires config.sql.dbPath");
    }
    if (!sqlConfig.query) {
      throw new Error("sqlite adapter requires config.sql.query");
    }
    queryOut = path.join(stepDir, "query.sql");
    resultOut = path.join(stepDir, "result.csv");
    await fs.writeFile(queryOut, sqlConfig.query, "utf-8");
    queryText = sqlConfig.query;

    const db = getSqliteConnection(sqlConfig.dbPath);
    const rows = db.prepare(sqlConfig.query).all() as Array<Record<string, unknown>>;
    resultRaw = rowsToCsv(rows);

    await fs.writeFile(resultOut, resultRaw, "utf-8");
    queryFile = path.basename(queryOut);
    resultFile = path.basename(resultOut);
    parsed = parseResult(resultFile, resultRaw);
  } else if (adapter === "mysql") {
    if (!sqlConfig.mysql) {
      throw new Error("mysql adapter requires config.sql.mysql");
    }
    if (!sqlConfig.query) {
      throw new Error("mysql adapter requires config.sql.query");
    }
    queryOut = path.join(stepDir, "query.sql");
    resultOut = path.join(stepDir, "result.csv");
    await fs.writeFile(queryOut, sqlConfig.query, "utf-8");
    queryText = sqlConfig.query;

    const connection = await getMysqlConnection(sqlConfig.mysql);
    const [rows] = await connection.execute(sqlConfig.query);
    resultRaw = rowsToCsv(rows as Array<Record<string, unknown>>);

    await fs.writeFile(resultOut, resultRaw, "utf-8");
    queryFile = path.basename(queryOut);
    resultFile = path.basename(resultOut);
    parsed = parseResult(resultFile, resultRaw);
  } else {
    if (!sqlConfig.queryPath || !sqlConfig.resultPath) {
      throw new Error("sqlEvidence step requires queryPath and resultPath when adapter is not sqlite");
    }
    const queryAbs = path.resolve(sqlConfig.queryPath);
    const resultAbs = path.resolve(sqlConfig.resultPath);

    queryFile = path.basename(queryAbs);
    resultFile = path.basename(resultAbs);
    queryOut = path.join(stepDir, queryFile);
    resultOut = path.join(stepDir, resultFile);

    await fs.copyFile(queryAbs, queryOut);
    await fs.copyFile(resultAbs, resultOut);
    queryText = await fs.readFile(queryOut, "utf-8");

    resultRaw = await fs.readFile(resultOut, "utf-8");
    parsed = parseResult(resultFile, resultRaw);
  }
  const rowsData = toRowsData(parsed);
  const rowCount = rowsData.length;

  if (sqlConfig.expectRows !== undefined && rowCount !== sqlConfig.expectRows) {
    throw new Error(`Expected ${sqlConfig.expectRows} rows but got ${rowCount}`);
  }

  const evidenceHtmlPath = path.join(stepDir, "evidence.html");
  const evidenceHtml = buildEvidenceHtml(parsed, resultFile, {
    queryText,
    executedAt
  });
  await fs.writeFile(evidenceHtmlPath, evidenceHtml, "utf-8");
  const evidenceFile = path.basename(evidenceHtmlPath);

  const screenshotPath = path.join(stepDir, "screenshot.png");
  await screenshotFile(evidenceHtmlPath, screenshotPath);

  return {
    files: [queryOut, resultOut, evidenceHtmlPath],
    screenshotPath,
    queryFile,
    resultFile,
    evidenceFile,
    rows: rowCount,
    rowsData
  };
}

export async function closeSqlConnections(): Promise<void> {
  for (const db of sqliteConnections.values()) {
    db.close();
  }
  sqliteConnections.clear();
  if (mysqlConnection) {
    await mysqlConnection.end();
    mysqlConnection = null;
    mysqlConnectionKey = "";
  }
}

type ParsedResult =
  | { type: "csv"; data: CsvData }
  | { type: "json"; data: unknown[] };

function parseResult(filename: string, raw: string): ParsedResult {
  if (filename.toLowerCase().endsWith(".json")) {
    const data = JSON.parse(raw) as unknown[];
    if (!Array.isArray(data)) {
      throw new Error("JSON result must be an array");
    }
    return { type: "json", data };
  }
  return { type: "csv", data: parseCsv(raw) };
}

function parseCsv(raw: string): CsvData {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = lines[0].split(",");
  const rows = lines.slice(1).map((line) => line.split(","));
  return { headers, rows };
}

function toRowsData(parsed: ParsedResult): Array<Record<string, string>> {
  if (parsed.type === "csv") {
    return parsed.data.rows.map((row) => {
      const record: Record<string, string> = {};
      parsed.data.headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });
      return record;
    });
  }
  return parsed.data.map((row) => {
    if (!row || typeof row !== "object") {
      return { value: String(row) };
    }
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
      record[key] = value === undefined ? "" : String(value);
    }
    return record;
  });
}

function buildEvidenceHtml(
  parsed: ParsedResult,
  resultName: string,
  meta: { queryText: string; executedAt: string }
): string {
  const tableName = extractTableName(meta.queryText);
  const metadataHtml = [
    `<div><strong>Executed at:</strong> ${escapeHtml(meta.executedAt)}</div>`,
    tableName ? `<div><strong>Table:</strong> ${escapeHtml(tableName)}</div>` : "",
    `<div><strong>Query:</strong></div>`,
    `<pre>${escapeHtml(meta.queryText.trim())}</pre>`
  ]
    .filter(Boolean)
    .join("");

  if (parsed.type === "json") {
    const rowsData = toRowsData(parsed);
    const headers = collectHeaders(rowsData);
    const table = renderTable(headers, rowsData);
    return wrapHtml(`<h2>${resultName}</h2>${metadataHtml}${table}`);
  }

  const headers = parsed.data.headers;
  const rowsData = parsed.data.rows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
  const table = renderTable(headers, rowsData);
  return wrapHtml(`<h2>${resultName}</h2>${metadataHtml}${table}`);
}

function rowsToCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((header) => escapeCsv(header)).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(String(row[header] ?? ""))).join(","))
  ];
  return lines.join("\n");
}

function getSqliteConnection(dbPath: string): SqliteDatabase {
  const key = path.resolve(dbPath);
  const cached = sqliteConnections.get(key);
  if (cached) {
    return cached;
  }
  const db = new DatabaseConstructor(key);
  sqliteConnections.set(key, db);
  return db;
}

async function getMysqlConnection(config: MysqlConfig): Promise<Connection> {
  const key = [
    config.host,
    config.port ?? 3306,
    config.user,
    config.database
  ].join("|");
  if (mysqlConnection && mysqlConnectionKey === key) {
    return mysqlConnection;
  }
  if (mysqlConnection) {
    await mysqlConnection.end();
    mysqlConnection = null;
    mysqlConnectionKey = "";
  }
  mysqlConnection = await mysql.createConnection({
    host: config.host,
    port: config.port ?? 3306,
    user: config.user,
    password: config.password,
    database: config.database
  });
  mysqlConnectionKey = key;
  return mysqlConnection;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function extractTableName(queryText: string): string | null {
  const match = /\bfrom\s+([a-zA-Z0-9_."`]+)/i.exec(queryText);
  if (!match) {
    return null;
  }
  return match[1].replace(/^["`]|["`]$/g, "");
}

function collectHeaders(rows: Array<Record<string, string>>): string[] {
  const headers = new Set<string>();
  for (const row of rows) {
    Object.keys(row).forEach((key) => headers.add(key));
  }
  return Array.from(headers);
}

function renderTable(headers: string[], rows: Array<Record<string, string>>): string {
  if (headers.length === 0) {
    return "<p>No rows returned.</p>";
  }
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const rowsHtml = rows
    .map((row) => {
      const cells = headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
}

function wrapHtml(body: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 6px; }
    th { background: #f5f5f5; text-align: left; }
    pre { background: #f8f8f8; padding: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function screenshotFile(htmlPath: string, screenshotPath: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } finally {
    await browser.close();
  }
}
