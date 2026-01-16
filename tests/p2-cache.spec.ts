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
    executeApiStep: async () => {
      calls.push("api");
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

describe("P2 cache", () => {
  it("skips steps when cache hits", async () => {
    calls.length = 0;
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-cache-"));
    const outDir = path.join(tempRoot, "runs");
    const cacheDir = path.join(tempRoot, "cache");

    const plan: Plan = {
      metadata: { feature: "cache" },
      cache: { enabled: true, dir: cacheDir },
      steps: [{ id: "step-1", type: "api" }]
    };

    await executePlan(plan, outDir);
    await executePlan(plan, outDir);

    expect(calls).toEqual(["api"]);

    const runIds = await fs.readdir(outDir);
    const summaries = await Promise.all(
      runIds.map(async (runId) => {
        const summaryRaw = await fs.readFile(path.join(outDir, runId, "00_runSummary.json"), "utf-8");
        return JSON.parse(summaryRaw);
      })
    );

    const cacheHit = summaries.find((summary) =>
      summary.steps?.some((step: { notes?: string; outputs?: { cacheHit?: boolean } }) =>
        step.notes === "cache hit" || step.outputs?.cacheHit
      )
    );

    expect(cacheHit).toBeTruthy();
  });
});
