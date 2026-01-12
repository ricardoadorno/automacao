import { promises as fs } from "fs";
import path from "path";
import { chromium } from "playwright";
import { runActions } from "../browser/actions";
import { BehaviorAction } from "../browser/behaviors";
import { OpenApiSpec, hasOperationId, hasPathMethod } from "./openapi";
import { PlanStep } from "../../core/types";

interface SwaggerStepResult {
  screenshotPath: string;
  responseText?: string;
  evidenceFile: string;
}

export async function executeSwaggerStep(
  step: PlanStep,
  actions: BehaviorAction[],
  openapi: OpenApiSpec | null,
  stepDir: string
): Promise<SwaggerStepResult> {
  if (!openapi) {
    throw new Error("openapiPath is required for swagger steps");
  }

  const config = step.config ?? {};
  if (config.operationId) {
    if (!hasOperationId(openapi, config.operationId)) {
      throw new Error(`operationId not found: ${config.operationId}`);
    }
  } else if (config.path && config.method) {
    if (!hasPathMethod(openapi, config.path, config.method)) {
      throw new Error(`path+method not found: ${config.method} ${config.path}`);
    }
  } else {
    throw new Error("swagger step requires operationId or path+method");
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const { method, path: pathKey, operation } = resolveOperation(openapi, config);

  try {
    await runActions(page, actions);
    const screenshotPath = path.join(stepDir, "screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    let responseText: string | undefined;
    if (config.responseSelector) {
      responseText = await page.textContent(config.responseSelector) ?? "";
    }

    const evidencePath = path.join(stepDir, "evidence.html");
    const evidenceHtml = buildSwaggerEvidenceHtml(step, {
      method,
      path: pathKey,
      operation,
      responseText,
      responseSelector: config.responseSelector
    });
    await fs.writeFile(evidencePath, evidenceHtml, "utf-8");

    return { screenshotPath, responseText, evidenceFile: path.basename(evidencePath) };
  } finally {
    await browser.close();
  }
}

function resolveOperation(
  openapi: OpenApiSpec,
  config: NonNullable<PlanStep["config"]>
): { method: string; path: string; operation: Record<string, unknown> | null } {
  if (!openapi.paths) {
    return { method: "", path: "", operation: null };
  }

  if (config.operationId) {
    for (const [pathKey, pathItem] of Object.entries(openapi.paths)) {
      for (const [method, operation] of Object.entries(pathItem ?? {})) {
        if (
          operation &&
          typeof operation === "object" &&
          (operation as { operationId?: string }).operationId === config.operationId
        ) {
          return {
            method: method.toUpperCase(),
            path: pathKey,
            operation: operation && typeof operation === "object" ? (operation as Record<string, unknown>) : null
          };
        }
      }
    }
  } else if (config.path && config.method) {
    const pathItem = openapi.paths[config.path] ?? {};
    const operation = (pathItem as Record<string, unknown>)[config.method.toLowerCase()];
    return {
      method: config.method.toUpperCase(),
      path: config.path,
      operation: (operation as Record<string, unknown>) ?? null
    };
  }

  return { method: "", path: "", operation: null };
}

function buildSwaggerEvidenceHtml(
  step: PlanStep,
  data: {
    method: string;
    path: string;
    operation: Record<string, unknown> | null;
    responseText?: string;
    responseSelector?: string;
  }
): string {
  const metaRows = [
    ["Step", step.id ?? step.type],
    ["OperationId", step.config?.operationId ?? "-"],
    ["Method", data.method || "-"],
    ["Path", data.path || "-"],
    ["Response selector", data.responseSelector ?? "-"]
  ];

  const requestBody = data.operation?.requestBody as Record<string, unknown> | undefined;
  const requestBodyHtml = requestBody
    ? `<h3>Request body</h3><pre>${escapeHtml(JSON.stringify(requestBody, null, 2))}</pre>`
    : "";

  const responseHtml = data.responseText
    ? `<h3>Response body</h3><pre>${escapeHtml(data.responseText)}</pre>`
    : "<p>No response body captured.</p>";

  const metaTable = `<table><tbody>${metaRows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(String(value))}</td></tr>`)
    .join("")}</tbody></table>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    td, th { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; width: 180px; }
    pre { background: #f8f8f8; padding: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h2>Swagger Evidence</h2>
  ${metaTable}
  ${requestBodyHtml}
  ${responseHtml}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
