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

  // Get method class
  const methodLower = data.request.method.toLowerCase();

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

  // Build request headers table
  const requestHeadersTable = buildHeadersTable(data.request.headers);

  // Build response headers table
  const responseHeadersTable = buildHeadersTable(data.response.headers);

  // Build request body
  const requestBody = buildCodeBlock(data.request.body);

  // Build response body
  const responseBody = buildCodeBlock(data.response.body);

  // Get content type
  const contentType = data.response.headers["content-type"] || "N/A";

  // Replace all placeholders
  template = template
    .replace(/{{STEP_ID}}/g, step.id || step.type)
    .replace(/{{METHOD}}/g, data.request.method)
    .replace(/{{METHOD_LOWER}}/g, methodLower)
    .replace(/{{URL}}/g, escapeHtml(data.request.url))
    .replace(/{{TIMESTAMP}}/g, timestamp)
    .replace(/{{DURATION}}/g, duration)
    .replace(/{{REQUEST_HEADERS_TABLE}}/g, requestHeadersTable)
    .replace(/{{REQUEST_BODY}}/g, requestBody)
    .replace(/{{STATUS_CODE}}/g, String(data.response.statusCode))
    .replace(/{{STATUS_TEXT}}/g, data.response.statusText)
    .replace(/{{STATUS_CLASS}}/g, statusClass)
    .replace(/{{CONTENT_TYPE}}/g, escapeHtml(contentType))
    .replace(/{{RESPONSE_HEADERS_TABLE}}/g, responseHeadersTable)
    .replace(/{{RESPONSE_BODY}}/g, responseBody);

  return template;
}

/**
 * Build HTML table for headers
 */
function buildHeadersTable(headers: Record<string, string>): string {
  if (Object.keys(headers).length === 0) {
    return '<div class="empty-state">No headers</div>';
  }

  const rows = Object.entries(headers)
    .map(([key, value]) => {
      return `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`;
    })
    .join("");

  return `
    <table class="headers-table">
      <thead>
        <tr>
          <th>Header</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Build code block with copy button
 */
function buildCodeBlock(content?: string): string {
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

  return `
    <div class="code-block">
      <button class="copy-btn">Copy</button>
      <pre>${escapeHtml(formatted)}</pre>
    </div>
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
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { font-size: 32px; margin-bottom: 8px; font-weight: 600; }
    .header .subtitle { font-size: 16px; opacity: 0.9; }
    .content { padding: 32px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 20px; font-weight: 600; color: #333; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #667eea; display: flex; align-items: center; gap: 8px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; border-radius: 8px; }
    .info-card .label { font-size: 12px; text-transform: uppercase; color: #666; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.5px; }
    .info-card .value { font-size: 16px; color: #333; font-weight: 500; word-break: break-all; }
    .method-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 14px; text-transform: uppercase; }
    .method-get { background: #28a745; color: white; }
    .method-post { background: #007bff; color: white; }
    .method-put { background: #ffc107; color: #333; }
    .method-patch { background: #17a2b8; color: white; }
    .method-delete { background: #dc3545; color: white; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 14px; }
    .status-2xx { background: #28a745; color: white; }
    .status-3xx { background: #17a2b8; color: white; }
    .status-4xx { background: #ffc107; color: #333; }
    .status-5xx { background: #dc3545; color: white; }
    .code-block { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 14px; line-height: 1.6; position: relative; }
    .code-block pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
    .code-block .copy-btn { position: absolute; top: 12px; right: 12px; background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; transition: background 0.2s; }
    .code-block .copy-btn:hover { background: #5568d3; }
    .headers-table { width: 100%; border-collapse: collapse; background: #f8f9fa; border-radius: 8px; overflow: hidden; }
    .headers-table th, .headers-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #dee2e6; }
    .headers-table th { background: #667eea; color: white; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
    .headers-table tr:last-child td { border-bottom: none; }
    .headers-table td:first-child { font-weight: 600; color: #667eea; }
    .empty-state { text-align: center; padding: 40px; color: #999; font-style: italic; }
    .json-key { color: #9cdcfe; }
    .json-string { color: #ce9178; }
    .json-number { color: #b5cea8; }
    .json-boolean { color: #569cd6; }
    .json-null { color: #569cd6; }
    .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #dee2e6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 API Evidence</h1>
      <div class="subtitle">Step: {{STEP_ID}}</div>
    </div>
    <div class="content">
      <div class="section">
        <h2 class="section-title"><span>📤</span> Request Information</h2>
        <div class="info-grid">
          <div class="info-card">
            <div class="label">Method</div>
            <div class="value"><span class="method-badge method-{{METHOD_LOWER}}">{{METHOD}}</span></div>
          </div>
          <div class="info-card">
            <div class="label">URL</div>
            <div class="value">{{URL}}</div>
          </div>
          <div class="info-card">
            <div class="label">Timestamp</div>
            <div class="value">{{TIMESTAMP}}</div>
          </div>
          <div class="info-card">
            <div class="label">Duration</div>
            <div class="value">{{DURATION}}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <h2 class="section-title"><span>📋</span> Request Headers</h2>
        {{REQUEST_HEADERS_TABLE}}
      </div>
      <div class="section">
        <h2 class="section-title"><span>📦</span> Request Body</h2>
        {{REQUEST_BODY}}
      </div>
      <div class="section">
        <h2 class="section-title"><span>📥</span> Response Information</h2>
        <div class="info-grid">
          <div class="info-card">
            <div class="label">Status Code</div>
            <div class="value"><span class="status-badge status-{{STATUS_CLASS}}">{{STATUS_CODE}} {{STATUS_TEXT}}</span></div>
          </div>
          <div class="info-card">
            <div class="label">Content-Type</div>
            <div class="value">{{CONTENT_TYPE}}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <h2 class="section-title"><span>📋</span> Response Headers</h2>
        {{RESPONSE_HEADERS_TABLE}}
      </div>
      <div class="section">
        <h2 class="section-title"><span>📄</span> Response Body</h2>
        {{RESPONSE_BODY}}
      </div>
    </div>
    <div class="footer">Generated by Automation Framework • {{TIMESTAMP}}</div>
  </div>
  <script>
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const codeBlock = this.parentElement.querySelector('pre');
        navigator.clipboard.writeText(codeBlock.textContent);
        this.textContent = '✓ Copied!';
        setTimeout(() => { this.textContent = 'Copy'; }, 2000);
      });
    });
    function syntaxHighlight(json) {
      if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = 'json-key';
          else cls = 'json-string';
        } else if (/true|false/.test(match)) cls = 'json-boolean';
        else if (/null/.test(match)) cls = 'json-null';
        return '<span class="' + cls + '">' + match + '</span>';
      });
    }
    document.querySelectorAll('.code-block pre').forEach(pre => {
      try {
        const content = pre.textContent;
        const parsed = JSON.parse(content);
        pre.innerHTML = syntaxHighlight(parsed);
      } catch (e) {}
    });
  </script>
</body>
</html>`;
}
