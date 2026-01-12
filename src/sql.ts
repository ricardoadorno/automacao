import { promises as fs } from "fs";
import path from "path";
import { chromium } from "playwright";
import { createHash } from "crypto";
import Database from "better-sqlite3";
import { PlanStep } from "./types";

interface SqlEvidenceResult {
  files: string[];
  screenshotPath: string;
  hashesPath: string;
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

  if (adapter === "sqlite") {
    if (!sqlConfig.dbPath) {
      throw new Error("sqlite adapter requires config.sql.dbPath");
    }
    if (!sqlConfig.query) {
      throw new Error("sqlite adapter requires config.sql.query");
    }
    queryOut = path.join(stepDir, "query.sql");
    resultOut = path.join(stepDir, "result.json");
    await fs.writeFile(queryOut, sqlConfig.query, "utf-8");

    const db = new Database(path.resolve(sqlConfig.dbPath));
    try {
      const rows = db.prepare(sqlConfig.query).all();
      resultRaw = JSON.stringify(rows, null, 2);
    } finally {
      db.close();
    }

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

    resultRaw = await fs.readFile(resultOut, "utf-8");
    parsed = parseResult(resultFile, resultRaw);
  }
  const rowsData = toRowsData(parsed);
  const rowCount = rowsData.length;

  if (sqlConfig.expectRows !== undefined && rowCount !== sqlConfig.expectRows) {
    throw new Error(`Expected ${sqlConfig.expectRows} rows but got ${rowCount}`);
  }

  const evidenceHtmlPath = path.join(stepDir, "evidence.html");
  const evidenceHtml = buildEvidenceHtml(parsed, resultFile);
  await fs.writeFile(evidenceHtmlPath, evidenceHtml, "utf-8");
  const evidenceFile = path.basename(evidenceHtmlPath);

  const screenshotPath = path.join(stepDir, "screenshot.png");
  await screenshotFile(evidenceHtmlPath, screenshotPath);

  const hashesPath = path.join(stepDir, "hashes.json");
  const hashes = {
    query: await hashFile(queryOut),
    result: await hashFile(resultOut),
    evidenceHtml: await hashFile(evidenceHtmlPath)
  };
  await fs.writeFile(hashesPath, JSON.stringify(hashes, null, 2), "utf-8");

  return {
    files: [queryOut, resultOut, evidenceHtmlPath],
    screenshotPath,
    hashesPath,
    queryFile,
    resultFile,
    evidenceFile,
    rows: rowCount,
    rowsData
  };
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

function buildEvidenceHtml(parsed: ParsedResult, resultName: string): string {
  if (parsed.type === "json") {
    const jsonHtml = parsed.data.map((row) => `<pre>${escapeHtml(JSON.stringify(row, null, 2))}</pre>`).join("");
    return wrapHtml(`<h2>${resultName}</h2>${jsonHtml}`);
  }

  const headers = parsed.data.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const rows = parsed.data.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  const table = `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  return wrapHtml(`<h2>${resultName}</h2>${table}`);
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
    pre { background: #f8f8f8; padding: 12px; }
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

async function hashFile(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}
