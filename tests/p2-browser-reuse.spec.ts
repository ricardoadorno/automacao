/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { executePlan } from "../src/core/runner";
import { Plan } from "../src/core/types";

const calls: string[] = [];

vi.mock("../src/domains/browser/browser", () => {
  return {
    executeBrowserStep: async () => {
      calls.push("new");
      return {
        screenshotPath: "screenshot.png",
        screenshotPaths: ["screenshot.png"],
        attempts: 1
      };
    },
    executeBrowserStepWithSession: async () => {
      calls.push("shared");
      return {
        screenshotPath: "screenshot.png",
        screenshotPaths: ["screenshot.png"],
        attempts: 1
      };
    }
  };
});

vi.mock("../src/domains/browser/session", () => {
  return {
    createSession: async () => ({ page: {} }),
    closeSession: async () => undefined
  };
});

vi.mock("../src/domains/browser/behaviors", () => {
  return {
    loadBehaviors: async () => ({ test: { actions: [] } })
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

describe("P2 browser reuse session", () => {
  it("uses a shared browser session when enabled", async () => {
    calls.length = 0;
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-reuse-"));
    const outDir = path.join(tempRoot, "runs");

    const plan: Plan = {
      metadata: { feature: "browser-reuse" },
      behaviorsPath: "ignored.json",
      browser: { reuseSession: true },
      steps: [{ id: "step-1", type: "browser", behaviorId: "test" }]
    };

    await executePlan(plan, outDir);

    expect(calls).toEqual(["shared"]);
  });
});
