/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/runner";
import { Plan } from "../src/types";

const calls: string[] = [];
let cloudwatchActions: Array<{ type: string; url?: string }> = [];

vi.mock("../src/sql", () => {
  return {
    executeSqlEvidenceStep: async () => {
      calls.push("sql");
      return {
        files: [],
        screenshotPath: "screenshot.png",
        hashesPath: "hashes.json",
        queryFile: "query.sql",
        resultFile: "result.csv",
        evidenceFile: "evidence.html",
        rows: 1,
        rowsData: [{ id: "123" }]
      };
    }
  };
});

vi.mock("../src/swagger", () => {
  return {
    executeSwaggerStep: async () => {
      calls.push("swagger");
      return {
        screenshotPath: "screenshot.png",
        responseText: "{\"correlationId\":\"corr-123\"}"
      };
    }
  };
});

vi.mock("../src/cloudwatch", () => {
  return {
    executeCloudwatchStep: async (_step: unknown, actions: Array<{ type: string; url?: string }>) => {
      calls.push("cloudwatch");
      cloudwatchActions = actions;
      return {
        screenshotPath: "screenshot.png",
        attempts: 1
      };
    }
  };
});

describe("P2 order and chaining", () => {
  it("runs SQL -> Swagger -> Cloudwatch and resolves placeholders in order", async () => {
    calls.length = 0;
    cloudwatchActions = [];
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify({
        behaviors: {
          swagger: { actions: [] },
          cloudwatch: {
            actions: [{ type: "goto", url: "https://httpbin.org/anything?cid={correlationId}" }]
          }
        }
      }),
      "utf-8"
    );

    const plan: Plan = {
      metadata: { feature: "order" },
      behaviorsPath,
      steps: [
        {
          id: "sql",
          type: "sqlEvidence",
          config: { sql: { queryPath: "query.sql", resultPath: "result.csv" } }
        },
        {
          id: "swagger",
          type: "swagger",
          behaviorId: "swagger",
          config: { operationId: "getTodoById", responseSelector: "#resp" },
          exports: { correlationId: { source: "responseText", jsonPath: "correlationId" } }
        },
        {
          id: "cloudwatch",
          type: "cloudwatch",
          behaviorId: "cloudwatch",
          requires: ["correlationId"]
        }
      ]
    };

    await executePlan(plan, outDir);

    expect(calls).toEqual(["sql", "swagger", "cloudwatch"]);
    expect(cloudwatchActions[0].url).toBe("https://httpbin.org/anything?cid=corr-123");
  });

  it("fails fast when cloudwatch runs before swagger and requires missing context", async () => {
    calls.length = 0;
    cloudwatchActions = [];
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify({
        behaviors: {
          swagger: { actions: [] },
          cloudwatch: { actions: [{ type: "goto", url: "https://httpbin.org/anything?cid={correlationId}" }] }
        }
      }),
      "utf-8"
    );

    const plan: Plan = {
      metadata: { feature: "order" },
      behaviorsPath,
      steps: [
        {
          id: "cloudwatch",
          type: "cloudwatch",
          behaviorId: "cloudwatch",
          requires: ["correlationId"]
        },
        {
          id: "swagger",
          type: "swagger",
          behaviorId: "swagger",
          config: { operationId: "getTodoById", responseSelector: "#resp" }
        }
      ]
    };

    await executePlan(plan, outDir);

    expect(calls).toEqual([]);
    const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
    const stepDir = path.join(runDir, "steps", "01_cloudwatch");
    const metadata = JSON.parse(await fs.readFile(path.join(stepDir, "metadata.json"), "utf-8"));
    expect(metadata.status).toBe("FAIL");
  });
});
