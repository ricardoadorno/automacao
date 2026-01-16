import path from "path";
import { runActions } from "./actions";
import { BehaviorAction } from "./behaviors";
import { captureScreenshots } from "./capture";
import { BrowserOptions, BrowserSession, closeSession, createSession } from "./session";
import { applyViewport, applyZoom } from "./viewport";
import { PlanStep } from "../../core/types";

export interface BrowserStepResult {
  screenshotPath: string;
  screenshotPaths: string[];
  attempts: number;
}

export async function executeBrowserStep(
  step: PlanStep,
  actions: BehaviorAction[],
  stepDir: string,
  options?: BrowserOptions
): Promise<BrowserStepResult> {
  const retries = step.config?.retries ?? 0;
  const retryDelayMs = step.config?.retryDelayMs ?? 1000;
  const sessionOptions = step.config?.browser?.viewport
    ? { ...options, viewport: step.config.browser.viewport }
    : options;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const session = await createSession(sessionOptions);
    try {
      if (step.config?.browser?.viewport) {
        await applyViewport(session.page, step.config.browser.viewport);
      }
      if (typeof step.config?.browser?.zoom === "number") {
        await applyZoom(session.page, step.config.browser.zoom);
      }

      await runActions(session.page, actions);

      const screenshotPaths = await captureScreenshots(
        session.page,
        stepDir,
        step.config?.browser?.capture
      );
      const screenshotPath = screenshotPaths[0] ?? path.join(stepDir, "screenshot.png");

      await closeSession(session);
  return { screenshotPath, screenshotPaths, attempts: attempt + 1 };
    } catch (error) {
      lastError = error;
      await closeSession(session);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  throw lastError ?? new Error("browser step failed");
}

export async function executeBrowserStepWithSession(
  step: PlanStep,
  actions: BehaviorAction[],
  stepDir: string,
  session: BrowserSession
): Promise<BrowserStepResult> {
  const retries = step.config?.retries ?? 0;
  const retryDelayMs = step.config?.retryDelayMs ?? 1000;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (step.config?.browser?.viewport) {
        await applyViewport(session.page, step.config.browser.viewport);
      }
      if (typeof step.config?.browser?.zoom === "number") {
        await applyZoom(session.page, step.config.browser.zoom);
      }

      await runActions(session.page, actions);

      const screenshotPaths = await captureScreenshots(
        session.page,
        stepDir,
        step.config?.browser?.capture
      );
      const screenshotPath = screenshotPaths[0] ?? path.join(stepDir, "screenshot.png");

      return { screenshotPath, screenshotPaths, attempts: attempt + 1 };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  throw lastError ?? new Error("browser step failed");
}

 
