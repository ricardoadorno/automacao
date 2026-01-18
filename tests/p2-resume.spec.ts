/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan, PlanStep } from "../src/core/types";

const apiCalls: PlanStep[] = [];

vi.mock("../src/domains/api/api", () => {
  return {
    executeApiStep: async (step: PlanStep) => {
      apiCalls.push(step);
      if (step.id === "seed") {
        return {
          evidenceFile: "evidence.html",
          responseData: { token: "abc-123" },
          statusCode: 200
        };
      }
      return {
        evidenceFile: "evidence.html",
        responseData: { ok: true },
        statusCode: 200
      };
    }
  };
});

describe("P2 resume context", () => {
  it("reuses context from previous run to execute selected steps", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-resume-"));
    const outDir = path.join(tempRoot, "runs");
    const plan: Plan = {
      metadata: { feature: "resume" },
      steps: [
        {
          id: "seed",
          type: "api",
          description: "seed token",
          exports: { token: { source: "responseData", jsonPath: "token" } }
        },
        {
          id: "use",
          type: "api",
          description: "use {{token}}",
          requires: ["token"]
        }
      ]
    };

    await executePlan(plan, outDir);
    const runId = (await fs.readdir(outDir))[0];

    apiCalls.length = 0;
    await executePlan(plan, outDir, { selectedSteps: [2], resumeFrom: runId });

    const runIdTwo = (await fs.readdir(outDir))
      .filter((id) => id !== runId)
      .sort()
      .pop() as string;
    const summaryRaw = await fs.readFile(path.join(outDir, runIdTwo, "00_runSummary.json"), "utf-8");
    const summary = JSON.parse(summaryRaw);

    expect(summary.steps).toHaveLength(1);
    expect(summary.steps[0].id).toBe("use");
    expect(summary.steps[0].status).toBe("OK");
    expect(apiCalls[0].description).toBe("use abc-123");
  });
});
