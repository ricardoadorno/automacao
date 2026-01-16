/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executeTabularStep } from "../src/domains/tabular/tabular";
import { PlanStep } from "../src/core/types";

vi.mock("playwright", () => {
  return {
    chromium: {
      launch: async () => {
        return {
          newPage: async () => ({
            goto: async () => undefined,
            waitForFunction: async () => undefined,
            evaluate: async (fn: unknown) => {
              const source = typeof fn === "function" ? fn.toString() : String(fn);
              if (source.includes("__tabularError")) {
                return null;
              }
              if (source.includes("__tabularCounts")) {
                return { rows: 2, columns: 3 };
              }
              return null;
            },
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

describe("P2 tabular evidence", () => {
  it("generates viewer html and screenshot from csv", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const sourcePath = path.join(tempRoot, "data.csv");
    await fs.writeFile(sourcePath, "id,name,city\n1,Ana,Sao Paulo\n2,Caio,Rio\n", "utf-8");

    const step: PlanStep = {
      type: "tabular",
      config: {
        tabular: {
          sourcePath,
          viewer: { mode: "lite" }
        }
      }
    };

    const result = await executeTabularStep(step, stepDir);

    await fs.access(path.join(stepDir, "viewer.html"));
    await fs.access(path.join(stepDir, "screenshot.png"));
    expect(result.rows).toBe(2);
    expect(result.columns).toBe(3);
  });
});
