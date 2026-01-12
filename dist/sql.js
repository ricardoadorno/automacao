"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSqlEvidenceStep = executeSqlEvidenceStep;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const playwright_1 = require("playwright");
const crypto_1 = require("crypto");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
async function executeSqlEvidenceStep(step, stepDir) {
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
    let parsed;
    if (adapter === "sqlite") {
        if (!sqlConfig.dbPath) {
            throw new Error("sqlite adapter requires config.sql.dbPath");
        }
        if (!sqlConfig.query) {
            throw new Error("sqlite adapter requires config.sql.query");
        }
        queryOut = path_1.default.join(stepDir, "query.sql");
        resultOut = path_1.default.join(stepDir, "result.json");
        await fs_1.promises.writeFile(queryOut, sqlConfig.query, "utf-8");
        const db = new better_sqlite3_1.default(path_1.default.resolve(sqlConfig.dbPath));
        try {
            const rows = db.prepare(sqlConfig.query).all();
            resultRaw = JSON.stringify(rows, null, 2);
        }
        finally {
            db.close();
        }
        await fs_1.promises.writeFile(resultOut, resultRaw, "utf-8");
        queryFile = path_1.default.basename(queryOut);
        resultFile = path_1.default.basename(resultOut);
        parsed = parseResult(resultFile, resultRaw);
    }
    else {
        if (!sqlConfig.queryPath || !sqlConfig.resultPath) {
            throw new Error("sqlEvidence step requires queryPath and resultPath when adapter is not sqlite");
        }
        const queryAbs = path_1.default.resolve(sqlConfig.queryPath);
        const resultAbs = path_1.default.resolve(sqlConfig.resultPath);
        queryFile = path_1.default.basename(queryAbs);
        resultFile = path_1.default.basename(resultAbs);
        queryOut = path_1.default.join(stepDir, queryFile);
        resultOut = path_1.default.join(stepDir, resultFile);
        await fs_1.promises.copyFile(queryAbs, queryOut);
        await fs_1.promises.copyFile(resultAbs, resultOut);
        resultRaw = await fs_1.promises.readFile(resultOut, "utf-8");
        parsed = parseResult(resultFile, resultRaw);
    }
    const rowsData = toRowsData(parsed);
    const rowCount = rowsData.length;
    if (sqlConfig.expectRows !== undefined && rowCount !== sqlConfig.expectRows) {
        throw new Error(`Expected ${sqlConfig.expectRows} rows but got ${rowCount}`);
    }
    const evidenceHtmlPath = path_1.default.join(stepDir, "evidence.html");
    const evidenceHtml = buildEvidenceHtml(parsed, resultFile);
    await fs_1.promises.writeFile(evidenceHtmlPath, evidenceHtml, "utf-8");
    const evidenceFile = path_1.default.basename(evidenceHtmlPath);
    const screenshotPath = path_1.default.join(stepDir, "screenshot.png");
    await screenshotFile(evidenceHtmlPath, screenshotPath);
    const hashesPath = path_1.default.join(stepDir, "hashes.json");
    const hashes = {
        query: await hashFile(queryOut),
        result: await hashFile(resultOut),
        evidenceHtml: await hashFile(evidenceHtmlPath)
    };
    await fs_1.promises.writeFile(hashesPath, JSON.stringify(hashes, null, 2), "utf-8");
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
function parseResult(filename, raw) {
    if (filename.toLowerCase().endsWith(".json")) {
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
            throw new Error("JSON result must be an array");
        }
        return { type: "json", data };
    }
    return { type: "csv", data: parseCsv(raw) };
}
function parseCsv(raw) {
    const lines = raw.trim().split(/\r?\n/);
    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }
    const headers = lines[0].split(",");
    const rows = lines.slice(1).map((line) => line.split(","));
    return { headers, rows };
}
function toRowsData(parsed) {
    if (parsed.type === "csv") {
        return parsed.data.rows.map((row) => {
            const record = {};
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
        const record = {};
        for (const [key, value] of Object.entries(row)) {
            record[key] = value === undefined ? "" : String(value);
        }
        return record;
    });
}
function buildEvidenceHtml(parsed, resultName) {
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
function wrapHtml(body) {
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
function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function screenshotFile(htmlPath, screenshotPath) {
    const browser = await playwright_1.chromium.launch();
    const page = await browser.newPage();
    try {
        await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
        await page.screenshot({ path: screenshotPath, fullPage: true });
    }
    finally {
        await browser.close();
    }
}
async function hashFile(filePath) {
    const buffer = await fs_1.promises.readFile(filePath);
    return (0, crypto_1.createHash)("sha256").update(buffer).digest("hex");
}
