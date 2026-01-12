import path from "path";
import { chromium } from "playwright";
import { runActions } from "./actions";
import { BehaviorAction } from "./behaviors";

interface BrowserStepResult {
  screenshotPath: string;
}

export async function executeBrowserStep(
  actions: BehaviorAction[],
  stepDir: string
): Promise<BrowserStepResult> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await runActions(page, actions);

    const screenshotPath = path.join(stepDir, "screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return { screenshotPath };
  } finally {
    await browser.close();
  }
}

 
