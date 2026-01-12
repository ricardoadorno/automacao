import { Browser, BrowserContext, chromium, Page } from "playwright";
import { ViewportConfig } from "./viewport";

export interface BrowserOptions {
  channel?: "chrome" | "msedge";
  headless?: boolean;
  userDataDir?: string;
  viewport?: ViewportConfig;
}

export interface BrowserSession {
  page: Page;
  browser?: Browser;
  context?: BrowserContext;
}

export async function createSession(options?: BrowserOptions): Promise<BrowserSession> {
  const launchOptions: any = {
    headless: options?.headless ?? false,
    channel: options?.channel
  };
  const viewport = options?.viewport
    ? { width: options.viewport.width, height: options.viewport.height }
    : undefined;
  const deviceScaleFactor = options?.viewport?.deviceScaleFactor;

  if (options?.userDataDir) {
    const context = await chromium.launchPersistentContext(options.userDataDir, {
      ...launchOptions,
      viewport,
      deviceScaleFactor
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let page = context.pages()[0];
    if (!page) {
      page = await context.newPage();
    }
    return { page, context };
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport, deviceScaleFactor });
  const page = await context.newPage();
  return { page, browser, context };
}

export async function closeSession(session: BrowserSession): Promise<void> {
  if (session.context) {
    await session.context.close();
  } else if (session.browser) {
    await session.browser.close();
  }
}
