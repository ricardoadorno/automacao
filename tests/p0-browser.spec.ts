/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

vi.mock("../src/domains/browser/browser", () => {
  return {
    executeBrowserStep: async (_step: unknown, _actions: unknown, stepDir: string) => {
      const screenshotPath = path.join(stepDir, "screenshot.png");
      await fs.writeFile(screenshotPath, "fake");
      return { screenshotPath, screenshotPaths: [screenshotPath], attempts: 1 };
    }
  };
});

describe("P0.1 browser step", () => {
  it("creates run folder with metadata, index and screenshot", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify(
        {
          behaviors: {
            home: {
              actions: [{ type: "goto", url: "data:text/html,<h1>ok</h1>" }]
            }
          }
        },
        null,
        2
      ),
      "utf-8"
    );

    const plan: Plan = {
      metadata: { feature: "p0" },
      behaviorsPath,
      steps: [
        {
          id: "open",
          type: "browser",
          behaviorId: "home"
        }
      ]
    };

    await executePlan(plan, outDir);

    const runEntries = await fs.readdir(outDir);
    expect(runEntries.length).toBe(1);

    const runDir = path.join(outDir, runEntries[0]);
    const summaryPath = path.join(runDir, "00_runSummary.json");
    const indexPath = path.join(runDir, "index.html");
    const stepDir = path.join(runDir, "steps", "01_open");
    const metadataPath = path.join(stepDir, "metadata.json");
    const screenshotPath = path.join(stepDir, "screenshot.png");

    const summaryRaw = await fs.readFile(summaryPath, "utf-8");
    const summary = JSON.parse(summaryRaw) as { steps: Array<{ status: string }> };

    expect(summary.steps[0].status).toBe("OK");
    await fs.access(indexPath);
    await fs.access(metadataPath);
    await fs.access(screenshotPath);
  });
});
