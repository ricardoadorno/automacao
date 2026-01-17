import { promises as fs } from "fs";
import path from "path";
import { PlanStep } from "../../core/types";

export interface LogstreamResult {
  evidenceFile: string;
}

export async function executeLogstreamStep(step: PlanStep, stepDir: string): Promise<LogstreamResult> {
  const config = step.config?.logstream;
  if (!config?.url) {
    throw new Error("logstream requires config.logstream.url");
  }
  const title = config.title || "Logstream";
  const generatedAt = new Date().toISOString();
  const evidencePath = path.join(stepDir, "evidence.html");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; padding: 24px; }
    a { color: #1c6b4f; font-weight: 600; }
    .summary { font-size: 12px; color: #3b3f44; background: #f7f5ef; border: 1px solid #e0dbd1; border-radius: 8px; padding: 6px 8px; margin-bottom: 12px; }
    .summary-line { display: flex; flex-wrap: wrap; gap: 12px; }
    .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #6a6f76; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .btn { border: 1px solid #d0c9bc; background: #f7f4ee; color: #1f2328; padding: 6px 10px; border-radius: 8px; font-size: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.4px; }
    .btn.secondary { background: #fff; }
  </style>
</head>
<body>
  <div class="toolbar">
    <a class="btn secondary" href="evidence.html" download="evidence.html">Download HTML</a>
    <a class="btn" href="${escapeHtml(config.url)}" target="_blank" rel="noreferrer">Open logstream</a>
  </div>
  <div class="summary">
    <div class="summary-line">
      <span class="summary-label">Step</span>${escapeHtml(step.id ?? step.type)}
      <span class="summary-label">Type</span>${escapeHtml(step.type)}
      <span class="summary-label">Generated</span>${escapeHtml(generatedAt)}
    </div>
  </div>
  <h1>${escapeHtml(title)}</h1>
  <p>Abra o logstream abaixo:</p>
  <p><a href="${escapeHtml(config.url)}" target="_blank" rel="noreferrer">${escapeHtml(config.url)}</a></p>
</body>
</html>`;
  await fs.writeFile(evidencePath, html, "utf-8");
  return { evidenceFile: path.basename(evidencePath) };
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
