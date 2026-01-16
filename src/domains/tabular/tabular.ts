import { promises as fs } from "fs";
import path from "path";
import { chromium } from "playwright";
import { PlanStep } from "../../core/types";

type TabularFormat = "csv" | "xlsx";
type ViewerMode = "lite" | "tabulator";

interface TabularMeta {
  title: string;
  description?: string;
  fileName: string;
  format: TabularFormat;
  sheet?: string | number | null;
  delimiter?: string;
  maxRows?: number | null;
  totalRows?: number | null;
  totalColumns?: number | null;
  headers?: string[];
  rows?: string[][];
  fileBase64?: string;
  viewerMode: ViewerMode;
}

interface TabularResult {
  viewerFile: string;
  screenshotPath?: string;
  sourceFile: string;
  rows?: number;
  columns?: number;
  sheet?: string | number | null;
}

export async function executeTabularStep(
  step: PlanStep,
  stepDir: string
): Promise<TabularResult> {
  const config = step.config?.tabular;
  if (!config?.sourcePath) {
    throw new Error("tabular step requires config.tabular.sourcePath");
  }

  const sourceAbs = path.resolve(config.sourcePath);
  const sourceExt = detectFormat(sourceAbs, config.format);
  if (!sourceExt) {
    throw new Error("tabular step supports only .csv or .xlsx sources");
  }

  const sourceBasename = path.basename(sourceAbs);
  const sourceTarget = path.join(stepDir, sourceBasename);
  await fs.copyFile(sourceAbs, sourceTarget);

  const fileBuffer = await fs.readFile(sourceAbs);
  const viewerMode = config.viewer?.mode ?? "lite";
  const title = config.viewer?.title ?? sourceBasename;
  const maxRows = normalizeMaxRows(config.maxRows);
  const metaBase: TabularMeta = {
    title,
    description: step.description,
    fileName: sourceBasename,
    format: sourceExt,
    sheet: config.sheet ?? null,
    delimiter: config.delimiter ?? ",",
    maxRows,
    viewerMode
  };

  let rowsCount: number | undefined;
  let columnsCount: number | undefined;
  let meta: TabularMeta = metaBase;

  if (sourceExt === "csv") {
    const raw = fileBuffer.toString("utf-8");
    const parsed = parseCsv(raw, metaBase.delimiter ?? ",");
    rowsCount = parsed.rows.length;
    columnsCount = parsed.headers.length;
    const limitedRows = maxRows ? parsed.rows.slice(0, maxRows) : parsed.rows;
    meta = {
      ...metaBase,
      headers: parsed.headers,
      rows: limitedRows,
      totalRows: rowsCount,
      totalColumns: columnsCount
    };
  } else {
    meta = {
      ...metaBase,
      fileBase64: fileBuffer.toString("base64")
    };
  }

  const viewerHtml = buildViewerHtml(meta);
  const viewerPath = path.join(stepDir, "viewer.html");
  await fs.writeFile(viewerPath, viewerHtml, "utf-8");

  let screenshotPath: string | undefined;
  if (config.capture?.enabled !== false) {
    screenshotPath = path.join(stepDir, "screenshot.png");
    const counts = await screenshotViewer(
      viewerPath,
      screenshotPath,
      config.capture?.fullPage ?? true
    );
    if (counts) {
      rowsCount = rowsCount ?? counts.rows;
      columnsCount = columnsCount ?? counts.columns;
    }
  }

  return {
    viewerFile: path.basename(viewerPath),
    screenshotPath,
    sourceFile: path.basename(sourceTarget),
    rows: rowsCount,
    columns: columnsCount,
    sheet: config.sheet ?? null
  };
}

function detectFormat(sourcePath: string, format?: string): TabularFormat | null {
  const normalized = format?.toLowerCase();
  if (normalized === "csv" || normalized === "xlsx") {
    return normalized;
  }
  const ext = path.extname(sourcePath).toLowerCase();
  if (ext === ".csv") {
    return "csv";
  }
  if (ext === ".xlsx") {
    return "xlsx";
  }
  return null;
}

function normalizeMaxRows(input?: number): number | null {
  if (input === undefined || input === null) {
    return null;
  }
  const value = Math.floor(Number(input));
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function parseCsv(raw: string, delimiter: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    if (!inQuotes && char === delimiter) {
      row.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  row.push(current);
  rows.push(row);

  if (rows.length > 0 && rows[rows.length - 1].every((cell) => cell === "")) {
    rows.pop();
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = rows[0].map((cell) => cell.trim());
  const dataRows = rows.slice(1);
  return { headers, rows: dataRows };
}

function buildViewerHtml(meta: TabularMeta): string {
  const useTabulator = meta.viewerMode === "tabulator";
  const needsXlsx = meta.format === "xlsx";
  const tabulatorCss = useTabulator
    ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabulator-tables@5.6.2/dist/css/tabulator.min.css" />'
    : "";
  const tabulatorJs = useTabulator
    ? '<script src="https://cdn.jsdelivr.net/npm/tabulator-tables@5.6.2/dist/js/tabulator.min.js"></script>'
    : "";
  const xlsxJs = needsXlsx
    ? '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>'
    : "";
  const descriptionBlock = meta.description
    ? `<div class="description">${escapeHtml(meta.description)}</div>`
    : "";
  const truncatedNote =
    meta.maxRows && meta.totalRows && meta.totalRows > meta.maxRows
      ? `<div class="note">Showing first ${meta.maxRows} rows of ${meta.totalRows}.</div>`
      : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(meta.title)}</title>
  ${tabulatorCss}
  ${tabulatorJs}
  ${xlsxJs}
  <style>
    :root {
      --bg: #f4f1ea;
      --card: #ffffff;
      --ink: #1e242d;
      --muted: #6b727b;
      --accent: #3b6ea5;
      --border: #ded7c8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", sans-serif;
      background: var(--bg);
      color: var(--ink);
    }
    header {
      padding: 18px 24px;
      background: linear-gradient(135deg, #f7edd6 0%, #e5f0f7 100%);
      border-bottom: 1px solid var(--border);
    }
    header h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.4px;
    }
    header .meta {
      margin-top: 6px;
      font-size: 12px;
      color: var(--muted);
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    main {
      padding: 18px 24px 28px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 12px 28px rgba(28, 29, 33, 0.08);
    }
    .controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    .controls label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .controls input,
    .controls select {
      width: 100%;
      margin-top: 6px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 12px;
      font-family: inherit;
    }
    .note {
      font-size: 12px;
      color: var(--muted);
      margin: 10px 0 0;
    }
    .description {
      margin-top: 10px;
      padding: 10px;
      background: #fff3cd;
      border-radius: 8px;
      border: 1px solid #f0d99a;
      font-size: 12px;
    }
    #status {
      margin: 10px 0;
      font-size: 12px;
      color: #8a1f1f;
    }
    #table {
      margin-top: 10px;
    }
    table.viewer-table {
      border-collapse: collapse;
      width: 100%;
      font-size: 12px;
    }
    table.viewer-table th,
    table.viewer-table td {
      border-bottom: 1px solid #eee7d8;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    table.viewer-table th {
      background: #f7f3ea;
      position: sticky;
      top: 0;
      z-index: 1;
      cursor: pointer;
    }
    table.viewer-table tbody tr:nth-child(even) {
      background: #fbfaf7;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eef3f8;
      padding: 4px 8px;
      border-radius: 10px;
      font-size: 11px;
      color: #35506e;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(meta.title)}</h1>
    <div class="meta">
      <span class="badge">File: ${escapeHtml(meta.fileName)}</span>
      <span class="badge">Rows: <span id="rowCount">-</span></span>
      <span class="badge">Columns: <span id="columnCount">-</span></span>
      <span class="badge">Filtered: <span id="filteredCount">-</span></span>
    </div>
  </header>
  <main>
    <div class="card">
      <div class="controls">
        <div>
          <label for="globalFilter">Search all</label>
          <input id="globalFilter" placeholder="Type to filter" />
        </div>
        <div>
          <label for="columnSelect">Column</label>
          <select id="columnSelect"></select>
        </div>
        <div>
          <label for="columnFilter">Column filter</label>
          <input id="columnFilter" placeholder="Contains value" />
        </div>
      </div>
      ${descriptionBlock}
      ${truncatedNote}
      <div id="status"></div>
      <div id="table"></div>
    </div>
  </main>
  <script>
    const meta = ${JSON.stringify(meta)};
    const statusEl = document.getElementById("status");
    const rowCountEl = document.getElementById("rowCount");
    const columnCountEl = document.getElementById("columnCount");
    const filteredCountEl = document.getElementById("filteredCount");
    const globalFilterEl = document.getElementById("globalFilter");
    const columnSelectEl = document.getElementById("columnSelect");
    const columnFilterEl = document.getElementById("columnFilter");
    const tableEl = document.getElementById("table");
    let state = { headers: [], rows: [], filtered: [], sortIndex: null, sortDir: 1 };

    function setStatus(message) {
      statusEl.textContent = message || "";
    }

    function updateCounts(rows, headers, filtered) {
      rowCountEl.textContent = rows.length;
      columnCountEl.textContent = headers.length;
      filteredCountEl.textContent = filtered.length;
      window.__tabularCounts = {
        rows: rows.length,
        columns: headers.length,
        filtered: filtered.length
      };
    }

    function applyFilters() {
      const globalQuery = globalFilterEl.value.trim().toLowerCase();
      const columnIndex = Number.parseInt(columnSelectEl.value || "", 10);
      const columnQuery = columnFilterEl.value.trim().toLowerCase();
      let filtered = state.rows;
      if (globalQuery) {
        filtered = filtered.filter((row) =>
          row.some((cell) => String(cell || "").toLowerCase().includes(globalQuery))
        );
      }
      if (Number.isFinite(columnIndex) && columnQuery) {
        filtered = filtered.filter((row) =>
          String(row[columnIndex] || "").toLowerCase().includes(columnQuery)
        );
      }
      if (state.sortIndex !== null) {
        const index = state.sortIndex;
        const dir = state.sortDir;
        filtered = [...filtered].sort((a, b) => {
          const left = a[index] ?? "";
          const right = b[index] ?? "";
          const leftNum = Number(left);
          const rightNum = Number(right);
          if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) {
            return (leftNum - rightNum) * dir;
          }
          return String(left).localeCompare(String(right)) * dir;
        });
      }
      state.filtered = filtered;
      renderTable(filtered);
      updateCounts(state.rows, state.headers, filtered);
    }

    function renderTable(rows) {
      if (meta.viewerMode === "tabulator") {
        renderTabulator(rows);
        return;
      }
      if (state.headers.length === 0) {
        tableEl.innerHTML = "<div>No data available.</div>";
        return;
      }
      const head = state.headers
        .map((header, index) => \`<th data-index="\${index}">\${escapeHtml(header)}</th>\`)
        .join("");
      const body = rows
        .map((row) => {
          const cells = state.headers
            .map((_, index) => \`<td>\${escapeHtml(String(row[index] ?? ""))}</td>\`)
            .join("");
          return \`<tr>\${cells}</tr>\`;
        })
        .join("");
      tableEl.innerHTML =
        \`<table class="viewer-table"><thead><tr>\${head}</tr></thead><tbody>\${body}</tbody></table>\`;
      const headers = tableEl.querySelectorAll("th");
      headers.forEach((th) => {
        th.addEventListener("click", () => {
          const index = Number.parseInt(th.dataset.index || "", 10);
          if (!Number.isFinite(index)) return;
          if (state.sortIndex === index) {
            state.sortDir *= -1;
          } else {
            state.sortIndex = index;
            state.sortDir = 1;
          }
          applyFilters();
        });
      });
    }

    function renderTabulator(rows) {
      if (!window.Tabulator) {
        const message = "Tabulator library failed to load.";
        setStatus(message);
        window.__tabularError = message;
        return;
      }
      const data = rows.map((row) => {
        const record = {};
        state.headers.forEach((header, index) => {
          record[header] = row[index] ?? "";
        });
        return record;
      });
      tableEl.innerHTML = "";
      const columns = state.headers.map((header) => ({
        title: header,
        field: header,
        headerSort: true
      }));
      const table = new window.Tabulator(tableEl, {
        data,
        columns,
        layout: "fitDataStretch",
        maxHeight: "70vh"
      });
      window.__tabularTable = table;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function attachFilters() {
      globalFilterEl.addEventListener("input", () => {
        if (meta.viewerMode === "tabulator" && window.__tabularTable) {
          const query = globalFilterEl.value.trim().toLowerCase();
          if (!query) {
            window.__tabularTable.clearFilter();
            filteredCountEl.textContent = state.rows.length;
            return;
          }
          window.__tabularTable.setFilter((data) => {
            return Object.values(data).some((value) =>
              String(value || "").toLowerCase().includes(query)
            );
          });
          filteredCountEl.textContent = window.__tabularTable.getDataCount("active");
          return;
        }
        applyFilters();
      });
      columnFilterEl.addEventListener("input", () => {
        if (meta.viewerMode === "tabulator" && window.__tabularTable) {
          const field = columnSelectEl.value;
          const value = columnFilterEl.value.trim();
          window.__tabularTable.clearFilter();
          if (field && value) {
            window.__tabularTable.setFilter(field, "like", value);
          }
          filteredCountEl.textContent = window.__tabularTable.getDataCount("active");
          return;
        }
        applyFilters();
      });
      columnSelectEl.addEventListener("change", () => {
        if (meta.viewerMode === "tabulator" && window.__tabularTable) {
          const field = columnSelectEl.value;
          const value = columnFilterEl.value.trim();
          window.__tabularTable.clearFilter();
          if (field && value) {
            window.__tabularTable.setFilter(field, "like", value);
          }
          filteredCountEl.textContent = window.__tabularTable.getDataCount("active");
          return;
        }
        applyFilters();
      });
    }

    function initSelect(headers) {
      const options = headers.map((header, index) => {
        const value = meta.viewerMode === "tabulator" ? header : String(index);
        return \`<option value="\${escapeHtml(value)}">\${escapeHtml(header)}</option>\`;
      }).join("");
      columnSelectEl.innerHTML = '<option value="">All columns</option>' + options;
    }

    function parseCsv(raw, delimiter) {
      const rows = [];
      let current = "";
      let row = [];
      let inQuotes = false;
      for (let i = 0; i < raw.length; i += 1) {
        const char = raw[i];
        const next = raw[i + 1];
        if (char === '"') {
          if (inQuotes && next === '"') {
            current += '"';
            i += 1;
            continue;
          }
          inQuotes = !inQuotes;
          continue;
        }
        if (!inQuotes && (char === "\\n" || char === "\\r")) {
          if (char === "\\r" && next === "\\n") {
            i += 1;
          }
          row.push(current);
          rows.push(row);
          row = [];
          current = "";
          continue;
        }
        if (!inQuotes && char === delimiter) {
          row.push(current);
          current = "";
          continue;
        }
        current += char;
      }
      row.push(current);
      rows.push(row);
      if (rows.length > 0 && rows[rows.length - 1].every((cell) => cell === "")) {
        rows.pop();
      }
      const headers = rows.length > 0 ? rows[0] : [];
      const dataRows = rows.slice(1);
      return { headers, rows: dataRows };
    }

    function loadCsvData() {
      const headers = meta.headers || [];
      const rows = meta.rows || [];
      return { headers, rows };
    }

    function loadXlsxData() {
      if (!window.XLSX) {
        throw new Error("XLSX library failed to load. Check network access.");
      }
      const binary = atob(meta.fileBase64 || "");
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const workbook = window.XLSX.read(bytes, { type: "array" });
      const sheetName =
        meta.sheet !== null && meta.sheet !== undefined && meta.sheet !== ""
          ? meta.sheet
          : workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) || [];
      const headers = rows.length > 0 ? rows[0] : [];
      const dataRows = rows.slice(1);
      return { headers, rows: dataRows };
    }

    function finalize(headers, rows) {
      state.headers = headers;
      state.rows = rows;
      initSelect(headers);
      attachFilters();
      if (meta.viewerMode === "tabulator") {
        renderTable(rows);
        updateCounts(rows, headers, rows);
        window.__tabularReady = true;
        return;
      }
      applyFilters();
      window.__tabularReady = true;
    }

    function bootstrap() {
      try {
        let data;
        if (meta.format === "csv") {
          if (meta.headers && meta.rows) {
            data = loadCsvData();
          } else {
            data = parseCsv(atob(meta.fileBase64 || ""), meta.delimiter || ",");
          }
        } else {
          data = loadXlsxData();
        }
        if (meta.maxRows && data.rows.length > meta.maxRows) {
          data.rows = data.rows.slice(0, meta.maxRows);
        }
        finalize(data.headers, data.rows);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus(message);
        window.__tabularError = message;
      }
    }

    window.tabularApi = {
      setGlobalFilter: (value) => {
        globalFilterEl.value = value || "";
        if (meta.viewerMode === "tabulator" && window.__tabularTable) {
          const query = globalFilterEl.value.trim().toLowerCase();
          window.__tabularTable.clearFilter();
          if (query) {
            window.__tabularTable.setFilter((data) => {
              return Object.values(data).some((item) =>
                String(item || "").toLowerCase().includes(query)
              );
            });
          }
          filteredCountEl.textContent = window.__tabularTable.getDataCount("active");
          return;
        }
        applyFilters();
      },
      setColumnFilter: (index, value) => {
        if (meta.viewerMode === "tabulator") {
          const header =
            typeof index === "number"
              ? state.headers[index] ?? ""
              : index ?? "";
          columnSelectEl.value = header;
        } else {
          columnSelectEl.value = String(index ?? "");
        }
        columnFilterEl.value = value || "";
        if (meta.viewerMode === "tabulator" && window.__tabularTable) {
          window.__tabularTable.clearFilter();
          if (columnSelectEl.value && columnFilterEl.value) {
            window.__tabularTable.setFilter(columnSelectEl.value, "like", columnFilterEl.value);
          }
          filteredCountEl.textContent = window.__tabularTable.getDataCount("active");
          return;
        }
        applyFilters();
      },
      clearFilters: () => {
        globalFilterEl.value = "";
        columnSelectEl.value = "";
        columnFilterEl.value = "";
        if (meta.viewerMode === "tabulator" && window.__tabularTable) {
          window.__tabularTable.clearFilter();
          filteredCountEl.textContent = window.__tabularTable.getDataCount("active");
          return;
        }
        applyFilters();
      }
    };

    bootstrap();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function screenshotViewer(
  htmlPath: string,
  screenshotPath: string,
  fullPage: boolean
): Promise<{ rows: number; columns: number } | null> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: "load" });
    try {
      await page.waitForFunction(
        () => (window as { __tabularReady?: boolean }).__tabularReady === true ||
          Boolean((window as { __tabularError?: string }).__tabularError),
        { timeout: 15000 }
      );
    } catch (error) {
      // ignore timeouts, screenshot anyway
    }
    const errorText = await page.evaluate(() => {
      return (window as { __tabularError?: string }).__tabularError ?? null;
    });
    if (errorText) {
      throw new Error(errorText);
    }
    await page.screenshot({ path: screenshotPath, fullPage });
    const counts = await page.evaluate(() => {
      return (window as { __tabularCounts?: { rows: number; columns: number } }).__tabularCounts ?? null;
    });
    return counts ?? null;
  } finally {
    await browser.close();
  }
}
