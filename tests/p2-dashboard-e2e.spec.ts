/// <reference types="vitest" />
import { promises as fs } from "fs";
import path from "path";
import { execSync, spawn } from "child_process";
import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PORT = 3101;
const HOST = "localhost";
const BASE_URL = `http://${HOST}:${PORT}`;
const TRIGGERS_PATH = path.join(process.cwd(), "runs", "triggers.json");

async function waitForServerReady(timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/plans`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Dashboard server did not become ready in time");
}

describe("P2 dashboard e2e", () => {
  let server: ReturnType<typeof spawn> | null = null;

  beforeAll(async () => {
    execSync("npm --prefix frontend run build", { stdio: "ignore" });
    try {
      await fs.unlink(TRIGGERS_PATH);
    } catch (error) {
      // ignore missing file
    }

    server = spawn(process.execPath, ["scripts/dashboard.js"], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT), HOST },
      stdio: "ignore"
    });

    await waitForServerReady();
  }, 60000);

  afterAll(async () => {
    if (server) {
      server.kill();
    }
    try {
      await fs.unlink(TRIGGERS_PATH);
    } catch (error) {
      // ignore missing file
    }
  });

  it(
    "loads plans and creates triggers headlessly",
    async () => {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await page.click('[data-testid="tab-examples"]');
      await page.waitForSelector('[data-testid="plans-grid"]');
      await page.waitForSelector('[data-testid="plan-card"]', { timeout: 30000 });

      const planCount = await page.locator('[data-testid="plan-card"]').count();
      if (planCount === 0) {
        throw new Error("Plans not available");
      }

      await page.click('[data-testid="tab-triggers"]');
      await page.waitForSelector('[data-testid="trigger-form"]');

      await page.fill('[data-testid="trigger-name"]', "Dashboard E2E");
      await page.fill('[data-testid="trigger-provider"]', "eventbridge");
      await page.fill('[data-testid="trigger-target"]', "rule-demo");
      await page.fill('[data-testid="trigger-logs"]', "https://logs.example.com/stream");
      await page.click('[data-testid="trigger-form"] button[type=submit]');

      await page.waitForSelector('[data-testid="trigger-card"]');
      const triggerText = await page.locator('[data-testid="trigger-card"]').first().innerText();
      expect(triggerText).toContain("Dashboard E2E");

      await browser.close();
    },
    { timeout: 60000 }
  );
});
