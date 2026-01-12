/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/runner";
import { Plan } from "../src/types";

const browserCalls: unknown[] = [];

vi.mock("../src/browser", () => {
  return {
    executeBrowserStep: async (actions: unknown, stepDir: string) => {
      browserCalls.push(actions);
      await fs.writeFile(path.join(stepDir, "screenshot.png"), "fake");
      return { screenshotPath: path.join(stepDir, "screenshot.png") };
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

describe("P2 context and exports", () => {
  it("exports variable from SQL and resolves placeholder in behavior", async () => {
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
            actions: [{ type: "fill", selector: "#pedido", text: "{pedidoId}" }]
          }
        }
      }),
      "utf-8"
    );
    await fs.writeFile(queryPath, "select id from pedidos;", "utf-8");
    await fs.writeFile(resultPath, "id\n123\n", "utf-8");

    const plan: Plan = {
      metadata: { feature: "p2" },
      behaviorsPath,
      steps: [
        {
          id: "sql",
          type: "sqlEvidence",
          config: { sql: { queryPath, resultPath } },
          exports: { pedidoId: { source: "sql", column: "id" } }
        },
        {
          id: "browser",
          type: "browser",
          behaviorId: "fill",
          requires: ["pedidoId"]
        }
      ]
    };

    await executePlan(plan, outDir);

    const actions = browserCalls[0] as Array<{ type: string; text?: string }>;
    expect(actions[0].text).toBe("123");
  });

  it("fails early when required context is missing", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const outDir = path.join(tempRoot, "runs");
    const behaviorsPath = path.join(tempRoot, "behaviors.json");

    await fs.writeFile(behaviorsPath, JSON.stringify({ behaviors: { fill: { actions: [] } } }), "utf-8");

    const plan: Plan = {
      metadata: { feature: "p2" },
      behaviorsPath,
      steps: [
        {
          id: "browser",
          type: "browser",
          behaviorId: "fill",
          requires: ["missingId"]
        }
      ]
    };

    await executePlan(plan, outDir);

    const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
    const stepDir = path.join(runDir, "steps", "01_browser");
    const metadata = JSON.parse(await fs.readFile(path.join(stepDir, "metadata.json"), "utf-8"));
    expect(metadata.status).toBe("FAIL");
  });
});
