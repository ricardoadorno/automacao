/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

const calls: string[] = [];
let browserActions: Array<{ type: string; url?: string }> = [];

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
        responseData: { correlationId: "corr-123" },
        statusCode: 200
      };
    }
  };
});

vi.mock("../src/domains/browser/browser", () => {
  return {
    executeBrowserStep: async (_step: unknown, actions: Array<{ type: string; url?: string }>) => {
      calls.push("browser");
      browserActions = actions;
      return {
        screenshotPath: "screenshot.png",
        screenshotPaths: ["screenshot.png"],
        attempts: 1
      };
    }
  };
});

describe("P2 order and chaining", () => {
  it("runs SQL -> API -> Browser and resolves placeholders in order", async () => {
    calls.length = 0;
    browserActions = [];
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify({
        behaviors: {
          browser: {
            actions: [{ type: "goto", url: "https://httpbin.org/anything?cid={correlationId}" }]
          }
        }
      }),
      "utf-8"
    );

    const plan: Plan = {
      metadata: { feature: "order" },
      behaviorsPath,
      curlPath: "examples/api/get-post.curl",
      steps: [
        {
          id: "sql",
          type: "sqlEvidence",
          config: { sql: { queryPath: "query.sql", resultPath: "result.csv" } }
        },
        {
          id: "api",
          type: "api",
          exports: { correlationId: { source: "responseData", jsonPath: "correlationId" } }
        },
        {
          id: "browser",
          type: "browser",
          behaviorId: "browser",
          requires: ["correlationId"]
        }
      ]
    };

    await executePlan(plan, outDir);

    expect(calls).toEqual(["sql", "api", "browser"]);
    expect(browserActions[0].url).toBe("https://httpbin.org/anything?cid=corr-123");
  });

  it("fails fast when browser runs before api and requires missing context", async () => {
    calls.length = 0;
    browserActions = [];
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify({
        behaviors: {
          browser: { actions: [{ type: "goto", url: "https://httpbin.org/anything?cid={correlationId}" }] }
        }
      }),
      "utf-8"
    );

    const plan: Plan = {
      metadata: { feature: "order" },
      behaviorsPath,
      curlPath: "examples/api/get-post.curl",
      steps: [
        {
          id: "browser",
          type: "browser",
          behaviorId: "browser",
          requires: ["correlationId"]
        },
        {
          id: "api",
          type: "api"
        }
      ]
    };

    await executePlan(plan, outDir);

    expect(calls).toEqual([]);
    const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
    const stepDir = path.join(runDir, "steps", "01_browser");
    const metadata = JSON.parse(await fs.readFile(path.join(stepDir, "metadata.json"), "utf-8"));
    expect(metadata.status).toBe("FAIL");
  });
});
