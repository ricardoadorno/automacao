/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executeSwaggerStep } from "../src/domains/api/swagger";
import { executeCliStep } from "../src/domains/cli/cli";
import { PlanStep } from "../src/core/types";

vi.mock("playwright", () => {
  return {
    chromium: {
      launch: async () => {
        return {
          newPage: async () => ({
            goto: async () => undefined,
            screenshot: async ({ path: filePath }: { path: string }) => {
              await fs.writeFile(filePath, "fake");
            },
            textContent: async () => "{\"id\":1,\"title\":\"hello\"}"
          }),
          close: async () => undefined
        };
      }
    }
  };
});

describe("P3 evidence snapshots", () => {
  it("snapshots swagger evidence html", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "swagger");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "swagger",
      behaviorId: "swagger",
      config: { operationId: "getTodoById", responseSelector: "#resp" }
    };
    const openapi = {
      paths: {
        "/todos/{id}": {
          get: {
            operationId: "getTodoById",
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object", properties: { id: { type: "integer" } } }
                }
              }
            }
          }
        }
      }
    };

    const result = await executeSwaggerStep(step, [], openapi, stepDir);
    const html = await fs.readFile(path.join(stepDir, result.evidenceFile), "utf-8");

    expect(html).toMatchSnapshot();
  });

  it("snapshots cli evidence html", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "cli");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: process.execPath,
          args: ["-e", "console.log('ok'); console.error('err');"]
        }
      }
    };

    const result = await executeCliStep(step, stepDir);
    const html = await fs.readFile(path.join(stepDir, result.evidenceFile), "utf-8");
    const normalized = normalizeCliHtml(html);

    expect(normalized).toMatchSnapshot();
  });
});

function normalizeCliHtml(html: string): string {
  const normalizedPath = html.replace(/[A-Za-z]:\\[^<\n]*?node\.exe/g, "node");
  const durationRow = normalizedPath.replace(
    /<tr><th>DurationMs<\/th><td>\d+<\/td><\/tr>/g,
    "<tr><th>DurationMs</th><td>X</td></tr>"
  );
  return durationRow.replace(
    /(<tr>\s*<td>.*?<\/td>\s*<td>.*?<\/td>\s*<td>\d+<\/td>\s*<td>)\d+(<\/td>\s*<\/tr>)/g,
    "$1X$2"
  );
}
