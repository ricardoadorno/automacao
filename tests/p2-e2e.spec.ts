/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

const browserCalls: unknown[] = [];

vi.mock("../src/domains/browser/browser", () => {
  return {
    executeBrowserStep: async (_step: unknown, actions: unknown, stepDir: string) => {
      browserCalls.push(actions);
      const screenshotPath = path.join(stepDir, "screenshot.png");
      await fs.writeFile(screenshotPath, "fake");
      return { screenshotPath, screenshotPaths: [screenshotPath], attempts: 1 };
    }
  };
});

vi.mock("playwright", () => {
  return {
    chromium: {
      launch: async () => {
        return {
          newPage: async () => ({
            goto: async () => undefined,
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

describe("P2 e2e plan flow", () => {
  it("runs cli pipeline -> sql evidence -> browser with resolved context", async () => {
    browserCalls.length = 0;
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");
    const queryPath = path.join(tempRoot, "query.sql");
    const resultPath = path.join(tempRoot, "result.csv");

    await fs.writeFile(
      behaviorsPath,
      JSON.stringify({
        behaviors: {
          fill: {
            actions: [{ type: "fill", selector: "#token", text: "{{token}}" }]
          }
        }
      }),
      "utf-8"
    );
    await fs.writeFile(queryPath, "select token from tokens;", "utf-8");
    await fs.writeFile(resultPath, "token\nabc\n", "utf-8");

    const plan: Plan = {
      metadata: { feature: "e2e" },
      behaviorsPath,
      steps: [
        {
          id: "cli-pipeline",
          type: "cli",
          exports: { token: { source: "stdout", regex: "token=(\\w+)" } },
          config: {
            cli: {
              pipeline: {
                pre: [
                  { command: process.execPath, args: ["-e", "console.log('token=abc')"] }
                ],
                script: {
                  command: process.execPath,
                  args: ["-e", "console.log('script-ok')"]
                },
                post: [
                  { command: process.execPath, args: ["-e", "console.log('post-ok')"] }
                ]
              }
            }
          }
        },
        {
          id: "sql",
          type: "sqlEvidence",
          config: { sql: { queryPath, resultPath, expectRows: 1 } },
          exports: { tokenSql: { source: "sql", column: "token" } }
        },
        {
          id: "browser",
          type: "browser",
          behaviorId: "fill",
          requires: ["token", "tokenSql"]
        }
      ]
    };

    await executePlan(plan, outDir);

    const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
    await fs.access(path.join(runDir, "index.html"));
    await fs.access(path.join(runDir, "steps", "01_cli-pipeline", "evidence.html"));
    await fs.access(path.join(runDir, "steps", "02_sql", "evidence.html"));
    await fs.access(path.join(runDir, "steps", "03_browser", "screenshot.png"));

    const actions = browserCalls[0] as Array<{ type: string; text?: string }>;
    expect(actions[0].text).toBe("abc");
  });
});
