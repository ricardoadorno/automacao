import path from "path";
import { chromium } from "playwright";
import { runActions } from "./actions";
import { BehaviorAction } from "./behaviors";
import { PlanStep } from "../../core/types";

interface CloudwatchStepResult {
  screenshotPath: string;
  attempts: number;
}

export async function executeCloudwatchStep(
  step: PlanStep,
  actions: BehaviorAction[],
  stepDir: string
): Promise<CloudwatchStepResult> {
  const retries = step.config?.retries ?? 0;
  const retryDelayMs = step.config?.retryDelayMs ?? 1000;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
      await runActions(page, actions);
      const screenshotPath = path.join(stepDir, "screenshot.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await browser.close();
      return { screenshotPath, attempts: attempt + 1 };
    } catch (error) {
      lastError = error;
      await browser.close();
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  throw lastError ?? new Error("cloudwatch step failed");
}
