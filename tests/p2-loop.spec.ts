/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

const calls: string[] = [];

vi.mock("../src/domains/api/api", () => {
  return {
    executeApiStep: async (_step: unknown, _curlPath: string, _stepDir: string, inputs: Record<string, unknown>) => {
      calls.push(String(inputs.item));
      return {
        evidenceFile: "evidence.html",
        responseData: { ok: true },
        statusCode: 200
      };
    }
  };
});

vi.mock("../src/domains/sql/sql", () => {
  return {
    executeSqlEvidenceStep: async () => {
      throw new Error("sql should not run in this test");
    },
    closeSqlConnections: async () => undefined
  };
});

vi.mock("../src/domains/cli/cli", () => {
  return {
    executeCliStep: async () => {
      throw new Error("cli should not run in this test");
    }
  };
});

describe("P2 loop", () => {
  it("runs steps for each item in inputs", async () => {
    calls.length = 0;
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-loop-"));
    const outDir = path.join(tempRoot, "runs");

    const plan: Plan = {
      metadata: { feature: "loop" },
      inputs: {
        items: [{ item: "a" }, { item: "b" }]
      },
      steps: [
        {
          id: "step-loop",
          type: "api",
          loop: { usePlanItems: true }
        }
      ]
    };

    await executePlan(plan, outDir);

    expect(calls).toEqual(["a", "b"]);

    const runId = (await fs.readdir(outDir))[0];
    const summaryRaw = await fs.readFile(path.join(outDir, runId, "00_runSummary.json"), "utf-8");
    const summary = JSON.parse(summaryRaw);

    expect(summary.steps).toHaveLength(2);
    expect(summary.steps[0].id).toBe("step-loop__01");
    expect(summary.steps[0].outputs.loopIndex).toBe(1);
    expect(summary.steps[1].id).toBe("step-loop__02");
    expect(summary.steps[1].outputs.loopIndex).toBe(2);
  });
});
