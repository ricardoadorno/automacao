import { promises as fs } from "fs";
import path from "path";
import { loadCurl, interpolateCurl, ParsedCurl } from "./curl";
import { PlanStep } from "../../core/types";

export interface ApiStepResult {
  evidenceFile: string;
  responseData?: unknown;
  statusCode?: number;
}

interface ApiRequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

interface ApiResponseData {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

/**
 * Execute an API step using curl command
 */
export async function executeApiStep(
  step: PlanStep,
  curlPath: string,
  stepDir: string,
  inputs: Record<string, unknown>
): Promise<ApiStepResult> {
  if (!curlPath) {
    throw new Error("curlPath is required for API steps");
  }

  // Load and parse curl command
  const parsed = await loadCurl(curlPath);
  
  // Interpolate variables from inputs
  const interpolated = interpolateCurl(parsed, inputs);

  // Execute the request
  const startTime = Date.now();
  const response = await executeRequest(interpolated);
  const duration = Date.now() - startTime;

  // Parse response data
  let responseData: unknown;
  try {
    responseData = JSON.parse(response.body);
  } catch {
    responseData = response.body;
  }

  // Generate evidence HTML
  const evidencePath = path.join(stepDir, "evidence.html");
  const evidenceHtml = await buildApiEvidenceHtml(step, {
    request: {
      url: interpolated.url,
      method: interpolated.method,
      headers: interpolated.headers,
      body: interpolated.body
    },
    response: {
      ...response,
      duration
    }
  });

  await fs.writeFile(evidencePath, evidenceHtml, "utf-8");

  return {
    evidenceFile: path.basename(evidencePath),
    responseData,
    statusCode: response.statusCode
  };
}

/**
 * Execute HTTP request using fetch (Node 18+)
 */
async function executeRequest(parsed: ParsedCurl): Promise<ApiResponseData> {
  const startTime = Date.now();

  try {
    const response = await fetch(parsed.url, {
      method: parsed.method,
      headers: parsed.headers,
      body: parsed.body && parsed.method !== "GET" ? parsed.body : undefined
    });

    const duration = Date.now() - startTime;
    const body = await response.text();

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      statusCode: response.status,
      statusText: response.statusText,
      headers,
      body,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)} (${duration}ms)`);
  }
}

/**
 * Build evidence HTML from template
 */
async function buildApiEvidenceHtml(
  step: PlanStep,
  data: {
    request: ApiRequestData;
    response: ApiResponseData;
  }
): Promise<string> {
  let template = getApiTemplate();

  // Get status class
  let statusClass = "2xx";
  if (data.response.statusCode >= 300 && data.response.statusCode < 400) {
    statusClass = "3xx";
  } else if (data.response.statusCode >= 400 && data.response.statusCode < 500) {
    statusClass = "4xx";
  } else if (data.response.statusCode >= 500) {
    statusClass = "5xx";
  }

  // Format timestamp
  const timestamp = new Date().toISOString();

  // Format duration
  const duration = `${data.response.duration}ms`;

  // Build request body
  const requestBody = data.request.body
    ? buildSectionHtml("Request body", buildCodeBlock(data.request.body, "request"))
    : "";

  // Build response body
  const responseBody = buildSectionHtml(
    "Response body",
    buildCodeBlock(data.response.body, "response")
  );

  const descriptionBlock = step.description
    ? `<div class="description">${escapeHtml(step.description)}</div>`
    : "";

  // Replace all placeholders
  template = template
    .replace(/{{STEP_ID}}/g, step.id || step.type)
    .replace(/{{STEP_TYPE}}/g, step.type)
    .replace(/{{METHOD}}/g, data.request.method)
    .replace(/{{URL}}/g, escapeHtml(data.request.url))
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace(/{{DURATION}}/g, duration)
    .replace(/{{STATUS_CODE}}/g, String(data.response.statusCode))
    .replace(/{{STATUS_TEXT}}/g, data.response.statusText)
    .replace(/{{STATUS_CLASS}}/g, statusClass)
    .replace(/{{REQUEST_BODY_SECTION}}/g, requestBody)
    .replace(/{{RESPONSE_BODY_SECTION}}/g, responseBody)
    .replace(/{{DESCRIPTION_BLOCK}}/g, descriptionBlock);

  return template;
}

/**
 * Build code block
 */
function buildCodeBlock(content?: string, section?: "request" | "response"): string {
  if (!content) {
    return '<div class="empty-state">No content</div>';
  }

  // Try to format as JSON
  let formatted = content;
  try {
    const parsed = JSON.parse(content);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    // Not JSON, use as is
  }

  const attrs = section ? ` data-section="${section}"` : "";
  return `<pre class="code-block"${attrs}>${escapeHtml(formatted)}</pre>`;
}

function buildSectionHtml(title: string, bodyHtml: string): string {
  return `
    <section class="panel">
      <h2>${escapeHtml(title)}</h2>
      ${bodyHtml}
    </section>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Get API evidence template
 */
function getApiTemplate(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Evidence - {{STEP_ID}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", sans-serif; background: #f5f2ec; padding: 12px; min-height: 100vh; color: #1f2328; }
    .card { max-width: 980px; margin: 0 auto; background: #fff; border-radius: 10px; box-shadow: 0 10px 28px rgba(25, 28, 32, 0.12); overflow: hidden; border: 1px solid #e2ddd3; }
    .summary { padding: 10px 16px; background: #f7f4ee; border-bottom: 1px solid #e2ddd3; font-size: 11px; line-height: 1.5; }
    .summary-line { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 4px; }
    .summary-line:last-child { margin-bottom: 0; }
    .summary-label { color: #6a6f76; text-transform: uppercase; letter-spacing: 0.4px; font-size: 10px; margin-right: 4px; }
    .toolbar { padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid #eee9df; background: #fff; }
    .btn { border: 1px solid #d0c9bc; background: #f7f4ee; color: #1f2328; padding: 6px 10px; border-radius: 8px; font-size: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.4px; cursor: pointer; }
    .btn.secondary { background: #fff; }
    .panel { padding: 12px 16px; border-bottom: 1px solid #eee9df; }
    .panel:last-child { border-bottom: none; }
    .panel h2 { font-size: 13px; margin-bottom: 6px; }
    .code-block { background: #1f2328; color: #e6e1d6; padding: 10px; border-radius: 8px; font-family: "Lucida Console", Monaco, monospace; font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .empty-state { padding: 8px; border: 1px dashed #d4cec2; border-radius: 8px; color: #7a7f86; background: #fbfaf7; font-size: 10px; }
    .status-badge { padding: 2px 6px; border-radius: 999px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; border: 1px solid #ddd6cb; }
    .description { margin: 10px 16px 0; padding: 8px 10px; border-radius: 8px; background: #fff7db; border: 1px solid #f0e0a8; font-size: 11px; }
    .status-2xx { background: #cfe8d5; color: #1f3a2b; }
    .status-3xx { background: #cfe3ef; color: #193040; }
    .status-4xx { background: #f3d5a8; color: #5a3b16; }
    .status-5xx { background: #efb3b3; color: #5f2424; }
  </style>
</head>
<body>
  <div class="card">
    <div class="summary">
      <div class="summary-line">
        <span class="summary-label">Step</span>{{STEP_ID}}
        <span class="summary-label">Type</span>{{STEP_TYPE}}
        <span class="summary-label">Method</span>{{METHOD}}
        <span class="summary-label">Status</span><span class="status-badge status-{{STATUS_CLASS}}">{{STATUS_CODE}} {{STATUS_TEXT}}</span>
        <span class="summary-label">Duration</span>{{DURATION}}
      </div>
      <div class="summary-line">
        <span class="summary-label">URL</span>{{URL}}
      </div>
      <div class="summary-line">
        <span class="summary-label">Timestamp</span>{{TIMESTAMP}}
      </div>
    </div>
    <div class="toolbar">
      <a class="btn" href="evidence.html" download="evidence.html">Download HTML</a>
      <button class="btn" id="download-response" type="button">Download response</button>
      <button class="btn secondary" id="download-request" type="button">Download request</button>
    </div>
    {{DESCRIPTION_BLOCK}}
    {{RESPONSE_BODY_SECTION}}
    {{REQUEST_BODY_SECTION}}
  </div>
  <script>
    (function () {
      function downloadFromSection(section, filename) {
        var pre = document.querySelector('pre.code-block[data-section="' + section + '"]');
        if (!pre) {
          return;
        }
        var text = pre.textContent || "";
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      }

      var responseBtn = document.getElementById("download-response");
      if (responseBtn) {
        responseBtn.addEventListener("click", function () {
          downloadFromSection("response", "response.txt");
        });
      }
      var requestBtn = document.getElementById("download-request");
      if (requestBtn) {
        requestBtn.addEventListener("click", function () {
          downloadFromSection("request", "request.txt");
        });
      }
    })();
  </script>
</body>
</html>`;
}
