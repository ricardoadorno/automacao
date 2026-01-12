import path from "path";
import { Page } from "playwright";
import { scrollTo } from "./viewport";

export type CaptureMode = "full" | "viewport" | "element" | "tiles";

export interface CaptureTilesConfig {
  direction?: "horizontal" | "vertical" | "both";
  overlapPx?: number;
  maxTiles?: number;
  waitMs?: number;
}

export interface CaptureConfig {
  mode?: CaptureMode;
  selector?: string;
  tiles?: CaptureTilesConfig;
}

interface PageMetrics {
  scrollWidth: number;
  scrollHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
}

export function buildTileOffsets(total: number, viewport: number, overlap: number): number[] {
  if (total <= viewport) {
    return [0];
  }

  const step = Math.max(1, viewport - overlap);
  const positions = [0];
  let current = 0;

  while (current + viewport < total) {
    const next = Math.min(current + step, total - viewport);
    if (next === current) {
      break;
    }
    positions.push(next);
    current = next;
  }

  return positions;
}

export async function captureScreenshots(
  page: Page,
  stepDir: string,
  config?: CaptureConfig
): Promise<string[]> {
  const mode = config?.mode ?? "full";

  if (mode === "element") {
    if (!config?.selector) {
      throw new Error("capture.selector is required for element screenshots");
    }
    const target = page.locator(config.selector);
    const screenshotPath = path.join(stepDir, "screenshot.png");
    await target.screenshot({ path: screenshotPath });
    return [screenshotPath];
  }

  if (mode === "viewport") {
    const screenshotPath = path.join(stepDir, "screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    return [screenshotPath];
  }

  if (mode === "tiles") {
    return captureTiles(page, stepDir, config?.tiles);
  }

  const screenshotPath = path.join(stepDir, "screenshot.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return [screenshotPath];
}

async function captureTiles(page: Page, stepDir: string, config?: CaptureTilesConfig): Promise<string[]> {
  const metrics = await getPageMetrics(page);
  const overlap = config?.overlapPx ?? 0;
  const direction = config?.direction ?? "horizontal";
  const waitMs = config?.waitMs ?? 150;

  const xPositions = direction === "vertical"
    ? [metrics.scrollX]
    : buildTileOffsets(metrics.scrollWidth, metrics.viewportWidth, overlap);

  const yPositions = direction === "horizontal"
    ? [metrics.scrollY]
    : buildTileOffsets(metrics.scrollHeight, metrics.viewportHeight, overlap);

  const totalTiles = xPositions.length * yPositions.length;
  const maxTiles = config?.maxTiles ?? totalTiles;

  const screenshotPaths: string[] = [];
  let index = 0;

  for (const y of yPositions) {
    for (const x of xPositions) {
      if (index >= maxTiles) {
        break;
      }
      await scrollTo(page, x, y);
      if (waitMs > 0) {
        await page.waitForTimeout(waitMs);
      }
      const filename = `screenshot-${String(index + 1).padStart(2, "0")}.png`;
      const screenshotPath = path.join(stepDir, filename);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      screenshotPaths.push(screenshotPath);
      index += 1;
    }
    if (index >= maxTiles) {
      break;
    }
  }

  await scrollTo(page, metrics.scrollX, metrics.scrollY);
  return screenshotPaths;
}

async function getPageMetrics(page: Page): Promise<PageMetrics> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      scrollHeight: doc.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  });
}
