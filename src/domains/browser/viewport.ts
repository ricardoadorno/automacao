import { Page } from "playwright";

export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

export async function applyViewport(page: Page, viewport: ViewportConfig): Promise<void> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
}

export async function applyZoom(page: Page, scale: number): Promise<void> {
  await page.evaluate((value) => {
    const root = document.documentElement;
    root.style.zoom = String(value);
  }, scale);
}

export async function scrollTo(page: Page, x?: number, y?: number): Promise<void> {
  await page.evaluate(
    ({ xValue, yValue }) => {
      const nextX = xValue ?? window.scrollX;
      const nextY = yValue ?? window.scrollY;
      window.scrollTo(nextX, nextY);
    },
    { xValue: x, yValue: y }
  );
}

export async function scrollBy(page: Page, x?: number, y?: number): Promise<void> {
  await page.evaluate(
    ({ xValue, yValue }) => {
      const deltaX = xValue ?? 0;
      const deltaY = yValue ?? 0;
      window.scrollBy(deltaX, deltaY);
    },
    { xValue: x, yValue: y }
  );
}
