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
  const evidencePath = path.join(stepDir, "evidence.html");
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; padding: 24px; }
    a { color: #1c6b4f; font-weight: 600; }
  </style>
</head>
<body>
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
