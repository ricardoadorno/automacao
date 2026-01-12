import { Page } from "playwright";
import { BehaviorAction } from "./behaviors";
import { applyViewport, applyZoom, scrollBy, scrollTo } from "./viewport";

export async function runActions(page: Page, actions: BehaviorAction[]): Promise<void> {
  for (const action of actions) {
    await runAction(page, action);
  }
}

async function runAction(page: Page, action: BehaviorAction): Promise<void> {
  switch (action.type) {
    case "goto":
      await page.goto(action.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      return;
    case "click":
      await page.click(action.selector);
      return;
    case "fill":
      await page.fill(action.selector, action.text);
      return;
    case "waitForSelector":
      await page.waitForSelector(action.selector, { state: action.state });
      return;
    case "waitForTimeout":
      await page.waitForTimeout(action.ms);
      return;
    case "waitForLoadState":
      await page.waitForLoadState(action.state ?? "load");
      return;
    case "scrollTo":
      await scrollTo(page, action.x, action.y);
      return;
    case "scrollBy":
      await scrollBy(page, action.x, action.y);
      return;
    case "setViewport":
      await applyViewport(page, {
        width: action.width,
        height: action.height,
        deviceScaleFactor: action.deviceScaleFactor
      });
      return;
    case "setZoom":
      await applyZoom(page, action.scale);
      return;
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unsupported action: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
