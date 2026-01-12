import path from "path";
import { chromium } from "playwright";
import { runActions } from "./actions";
import { BehaviorAction } from "./behaviors";
import { OpenApiSpec, hasOperationId, hasPathMethod } from "./openapi";
import { PlanStep } from "./types";

interface SwaggerStepResult {
  screenshotPath: string;
  responseText?: string;
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

  try {
    await runActions(page, actions);
    const screenshotPath = path.join(stepDir, "screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    let responseText: string | undefined;
    if (config.responseSelector) {
      responseText = await page.textContent(config.responseSelector) ?? "";
    }

    return { screenshotPath, responseText };
  } finally {
    await browser.close();
  }
}
