/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executeBrowserStep } from "../src/domains/browser/browser";
import { PlanStep } from "../src/core/types";

let attempts = 0;

vi.mock("../src/domains/browser/session", () => {
  return {
    createSession: async () => ({ page: {} }),
    closeSession: async () => undefined
  };
});

vi.mock("../src/domains/browser/actions", () => {
  return {
    runActions: async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error("not ready");
      }
    }
  };
});

vi.mock("../src/domains/browser/capture", () => {
  return {
    captureScreenshots: async (_page: unknown, stepDir: string) => {
      const screenshotPath = path.join(stepDir, "screenshot.png");
      await fs.writeFile(screenshotPath, "fake");
      return [screenshotPath];
    }
  };
});

describe("P4 browser retries", () => {
  it("retries until success and reports attempts", async () => {
    attempts = 0;
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "browser",
      behaviorId: "browser",
      config: { retries: 2, retryDelayMs: 1 }
    };

    const result = await executeBrowserStep(step, [], stepDir);
    expect(result.attempts).toBe(2);
    await fs.access(path.join(stepDir, "screenshot.png"));
  });
});
