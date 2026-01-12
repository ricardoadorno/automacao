/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executeCloudwatchStep } from "../src/domains/browser/cloudwatch";
import { PlanStep } from "../src/core/types";

let attempt = 0;

vi.mock("playwright", () => {
  return {
    chromium: {
      launch: async () => {
        return {
          newPage: async () => ({
            goto: async () => {
              attempt += 1;
              if (attempt < 2) {
                throw new Error("not ready");
              }
            },
            click: async () => undefined,
            fill: async () => undefined,
            waitForSelector: async () => undefined,
            waitForTimeout: async () => undefined,
            screenshot: async ({ path: filePath }: { path: string }) => {
              await fs.writeFile(filePath, "fake");
            }
          }),
          close: async () => undefined
        };
      }
    }
  };
});

describe("P4 cloudwatch retries", () => {
  it("retries until success and reports attempts", async () => {
    attempt = 0;
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cloudwatch",
      behaviorId: "cw",
      config: { retries: 2, retryDelayMs: 1 }
    };

    const result = await executeCloudwatchStep(step, [{ type: "goto", url: "http://example.com" }], stepDir);
    expect(result.attempts).toBe(2);
    await fs.access(path.join(stepDir, "screenshot.png"));
  });
});
