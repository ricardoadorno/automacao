/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/runner";
import { Plan } from "../src/types";

const executeBrowserStep = vi.fn();

vi.mock("../src/browser", () => {
  return {
    executeBrowserStep: (...args: unknown[]) => executeBrowserStep(...args)
  };
});

describe("P0.2 failure handling", () => {
  it("stops on failure by default and writes error artifacts", async () => {
    executeBrowserStep.mockRejectedValueOnce(new Error("boom"));

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify({ behaviors: { one: { actions: [] }, two: { actions: [] } } }),
      "utf-8"
    );

    const plan: Plan = {
      metadata: { feature: "p0" },
      behaviorsPath,
      steps: [
        { id: "one", type: "browser", behaviorId: "one" },
        { id: "two", type: "browser", behaviorId: "two" }
      ]
    };

    await executePlan(plan, outDir);

    const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
    const stepsDir = path.join(runDir, "steps");
    const steps = await fs.readdir(stepsDir);
    expect(steps.length).toBe(1);

    const stepDir = path.join(stepsDir, steps[0]);
    const metadata = JSON.parse(await fs.readFile(path.join(stepDir, "metadata.json"), "utf-8"));
    expect(metadata.status).toBe("FAIL");
    await fs.access(path.join(stepDir, "error.json"));
    await fs.access(path.join(stepDir, "error.png"));
  });

  it("continues on failure when failPolicy=continue", async () => {
    executeBrowserStep.mockRejectedValueOnce(new Error("boom"));
    executeBrowserStep.mockResolvedValueOnce({ screenshotPath: "screenshot.png" });

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify({ behaviors: { one: { actions: [] }, two: { actions: [] } } }),
      "utf-8"
    );

    const plan: Plan = {
      metadata: { feature: "p0" },
      behaviorsPath,
      failPolicy: "continue",
      steps: [
        { id: "one", type: "browser", behaviorId: "one" },
        { id: "two", type: "browser", behaviorId: "two" }
      ]
    };

    await executePlan(plan, outDir);

    const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
    const stepsDir = path.join(runDir, "steps");
    const steps = await fs.readdir(stepsDir);
    expect(steps.length).toBe(2);
  });
});
