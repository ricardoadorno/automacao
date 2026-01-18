/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

vi.mock("../src/domains/api/api", () => {
  return {
    executeApiStep: async () => {
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

describe("P2 inputs", () => {
  it("merges defaults, plan overrides, and env with clear precedence", async () => {
    const original = process.env.AUTO_FOO;
    process.env.AUTO_FOO = "env";

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-inputs-"));
    const outDir = path.join(tempRoot, "runs");
    const plan: Plan = {
      metadata: { feature: "inputs" },
      context: { FOO: "plan", BAR: "plan" },
      inputs: {
        defaults: { FOO: "default" },
        overrides: { FOO: "override", BAR: "override" },
        envPrefix: "AUTO_"
      },
      steps: [{ id: "step-1", type: "api" }]
    };

    await executePlan(plan, outDir);

    const runId = (await fs.readdir(outDir))[0];
    const summaryRaw = await fs.readFile(path.join(outDir, runId, "00_runSummary.json"), "utf-8");
    const summary = JSON.parse(summaryRaw);

    expect(summary.context.FOO).toBe("env");
    expect(summary.context.BAR).toBe("plan");

    if (original === undefined) {
      delete process.env.AUTO_FOO;
    } else {
      process.env.AUTO_FOO = original;
    }
  });
});
