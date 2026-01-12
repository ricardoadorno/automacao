/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executeSqlEvidenceStep } from "../src/domains/sql/sql";
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
            }
          }),
          close: async () => undefined
        };
      }
    }
  };
});

describe("P1 SQL evidence", () => {
  it("generates evidence html and screenshot", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const queryPath = path.join(tempRoot, "query.sql");
    const resultPath = path.join(tempRoot, "result.csv");

    await fs.writeFile(queryPath, "select 1;", "utf-8");
    await fs.writeFile(resultPath, "id,name\n1,Ana\n", "utf-8");

    const step: PlanStep = {
      type: "sqlEvidence",
      config: {
        sql: {
          queryPath,
          resultPath
        }
      }
    };

    const result = await executeSqlEvidenceStep(step, stepDir);

    await fs.access(path.join(stepDir, "evidence.html"));
    await fs.access(path.join(stepDir, "screenshot.png"));
    expect(result.rows).toBe(1);
  });

  it("fails when expectRows does not match", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "step");
    await fs.mkdir(stepDir, { recursive: true });

    const queryPath = path.join(tempRoot, "query.sql");
    const resultPath = path.join(tempRoot, "result.csv");

    await fs.writeFile(queryPath, "select 1;", "utf-8");
    await fs.writeFile(resultPath, "id,name\n1,Ana\n", "utf-8");

    const step: PlanStep = {
      type: "sqlEvidence",
      config: {
        sql: {
          queryPath,
          resultPath,
          expectRows: 2
        }
      }
    };

    await expect(executeSqlEvidenceStep(step, stepDir)).rejects.toThrow("Expected 2 rows");
  });
});
