/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

const calls: string[] = [];

vi.mock("../src/domains/sql/sql", () => {
  return {
    executeSqlEvidenceStep: async () => {
      calls.push("sql");
      return {
        files: [],
        screenshotPath: "screenshot.png",
        queryFile: "query.sql",
        resultFile: "result.csv",
        evidenceFile: "evidence.html",
        rows: 1,
        rowsData: [{ id: "123" }]
      };
    },
    closeSqlConnections: async () => undefined
  };
});

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

vi.mock("../src/domains/cli/cli", () => {
  return {
    executeCliStep: async () => {
      calls.push("cli");
      return {
        stdoutFile: "stdout.txt",
        stderrFile: "stderr.txt",
        evidenceFile: "evidence.html",
        exitCode: 0,
        durationMs: 12,
        stdout: "ok",
        stderr: ""
      };
    }
  };
});

describe("P2 run range", () => {
  it("executes only the selected range of steps", async () => {
    calls.length = 0;
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const plan: Plan = {
      metadata: { feature: "range" },
      steps: [
        { id: "step-1", type: "api" },
        { id: "step-2", type: "sqlEvidence", config: { sql: { query: "select 1" } } },
        { id: "step-3", type: "cli", config: { cli: { command: "node", args: ["-e", "console.log('ok')"] } } }
      ]
    };

    await executePlan(plan, outDir, { fromStep: 2, toStep: 3 });

    expect(calls).toEqual(["sql", "cli"]);
    const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
    const summaryRaw = await fs.readFile(path.join(runDir, "00_runSummary.json"), "utf-8");
    const summary = JSON.parse(summaryRaw);
    expect(summary.steps).toHaveLength(2);
    expect(summary.steps[0].id).toBe("step-2");
    expect(summary.steps[1].id).toBe("step-3");
  });
});
