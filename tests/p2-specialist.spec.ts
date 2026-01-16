/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

vi.mock("../src/domains/sql/sql", () => {
  return {
    executeSqlEvidenceStep: async () => {
      throw new Error("sql should not run in this test");
    },
    closeSqlConnections: async () => undefined
  };
});

vi.mock("../src/domains/api/api", () => {
  return {
    executeApiStep: async () => {
      throw new Error("api should not run in this test");
    }
  };
});

vi.mock("../src/domains/cli/cli", () => {
  return {
    executeCliStep: async () => {
      throw new Error("cli should not run in this test");
    }
  };
});

vi.mock("../src/domains/browser/browser", () => {
  return {
    executeBrowserStep: async () => {
      throw new Error("browser should not run in this test");
    },
    executeBrowserStepWithSession: async () => {
      throw new Error("browser should not run in this test");
    }
  };
});

vi.mock("../src/domains/browser/session", () => {
  return {
    createSession: async () => ({ page: {} }),
    closeSession: async () => undefined
  };
});

describe("P2 specialist", () => {
  it("writes a file in the step directory", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-specialist-"));
    const outDir = path.join(tempRoot, "runs");

    const plan: Plan = {
      metadata: { feature: "specialist" },
      steps: [
        {
          id: "write-file",
          type: "specialist",
          config: {
            specialist: {
              task: "writeFile",
              outputPath: "note.txt",
              content: "hello"
            }
          }
        }
      ]
    };

    await executePlan(plan, outDir);

    const runId = (await fs.readdir(outDir))[0];
    const notePath = path.join(outDir, runId, "steps", "01_write-file", "note.txt");
    const content = await fs.readFile(notePath, "utf-8");

    expect(content).toBe("hello");
  });
});
