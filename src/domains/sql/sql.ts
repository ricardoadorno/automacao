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

export async function executeSqlEvidenceStep(
  step: PlanStep, 
  stepDir: string,
  inputs: Record<string, unknown> = {}
): Promise<SqlEvidenceResult> {
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
    
    // Support both inline query and queryPath
    if (sqlConfig.queryPath) {
      const queryAbs = path.resolve(sqlConfig.queryPath);
      queryText = await fs.readFile(queryAbs, "utf-8");
      queryText = interpolateQuery(queryText, inputs);
    } else if (sqlConfig.query) {
      queryText = sqlConfig.query;
    } else {
      throw new Error("mysql adapter requires either config.sql.query or config.sql.queryPath");
    }
    
    queryOut = path.join(stepDir, "query.sql");
    resultOut = path.join(stepDir, "result.csv");
    await fs.writeFile(queryOut, queryText, "utf-8");

    const connection = await getMysqlConnection(sqlConfig.mysql);
    const [rows] = await connection.execute(queryText);
    
    // Handle UPDATE/INSERT/DELETE that return ResultSetHeader
    const rowsArray = Array.isArray(rows) ? rows : [];
    resultRaw = rowsToCsv(rowsArray as Array<Record<string, unknown>>);

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
  const evidenceHtml = buildEvidenceHtml(parsed, {
    queryText,
    executedAt,
    description: step.description
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
  meta: { queryText: string; executedAt: string; description?: string }
): string {
  const tableName = extractTableName(meta.queryText);
  const rowsData = parsed.type === "json"
    ? toRowsData(parsed)
    : parsed.data.rows.map((row) => {
        const record: Record<string, string> = {};
        parsed.data.headers.forEach((header, index) => {
          record[header] = row[index] ?? "";
        });
        return record;
      });
  const headers = parsed.type === "json" ? collectHeaders(rowsData) : parsed.data.headers;
  const rowCount = rowsData.length;
  const table = renderTable(headers, rowsData);

  const descriptionBlock = meta.description
    ? `<div class="description">${escapeHtml(meta.description)}</div>`
    : "";

  const body = `
    <div class="summary">
      <div class="summary-line">
        <span class="summary-label">Rows</span>${rowCount}
        ${tableName ? `<span class="summary-label">Table</span>${escapeHtml(tableName)}` : ""}
      </div>
      <div class="summary-line">
        <span class="summary-label">Executed</span>${escapeHtml(meta.executedAt)}
      </div>
      <div class="summary-line">
        <span class="summary-label">Query</span>${escapeHtml(meta.queryText.trim())}
      </div>
    </div>
    ${descriptionBlock}
    <section class="section">
      ${table}
    </section>
  `;

  return wrapHtml(body);
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
    return '<div class="empty-state">No rows returned.</div>';
  }
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const rowsHtml = rows
    .map((row) => {
      const cells = headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<div class="table-wrap"><table class="result-table"><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
}

function wrapHtml(body: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", sans-serif; background: #f5f2ec; padding: 12px; color: #1f2328; }
    .card { max-width: 980px; margin: 0 auto; background: #fff; border-radius: 10px; box-shadow: 0 10px 28px rgba(25, 28, 32, 0.12); overflow: hidden; border: 1px solid #e2ddd3; padding: 10px; }
    .summary { padding: 8px 10px; background: #f7f4ee; border: 1px solid #e2ddd3; border-radius: 8px; margin-bottom: 8px; font-size: 11px; line-height: 1.5; }
    .summary-line { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 4px; }
    .summary-line:last-child { margin-bottom: 0; }
    .summary-label { color: #6a6f76; text-transform: uppercase; letter-spacing: 0.4px; font-size: 10px; margin-right: 4px; }
    .description { padding: 8px 10px; border-radius: 8px; background: #fff7db; border: 1px solid #f0e0a8; font-size: 11px; margin-bottom: 8px; }
    .section { background: #fff; border: 1px solid #e4dfd5; border-radius: 10px; padding: 10px; margin-bottom: 10px; box-shadow: 0 6px 14px rgba(22, 24, 27, 0.06); }
    .table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e1dbcf; }
    .result-table { border-collapse: collapse; width: 100%; font-size: 11px; }
    .result-table th, .result-table td { padding: 6px 8px; border-bottom: 1px solid #eee9df; text-align: left; }
    .result-table th { background: #f1ede4; position: sticky; top: 0; z-index: 1; }
    .result-table tbody tr:nth-child(even) { background: #fbfaf7; }
    .empty-state { padding: 10px; border: 1px dashed #d4cec2; border-radius: 8px; color: #7a7f86; background: #fbfaf7; font-size: 11px; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
  </div>
</body>
</html>`;
}


function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function interpolateQuery(query: string, inputs: Record<string, unknown>): string {
  return query.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = inputs[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
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
