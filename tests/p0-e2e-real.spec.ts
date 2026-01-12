/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { executePlan } from "../src/core/runner";
import { loadPlan } from "../src/core/plan";

describe("P0 e2e real runner", () => {
  it(
    "executes examples/sqlite/plan.json end-to-end with real Playwright",
    async () => {
      const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
      const outDir = path.join(tempRoot, "runs");
      const plan = await loadPlan("examples/sqlite/plan.json");

      await executePlan(plan, outDir);

      const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
      await fs.access(path.join(runDir, "index.html"));
      await fs.access(path.join(runDir, "steps", "01_api-get-todo", "evidence.html"));
      await fs.access(path.join(runDir, "steps", "02_sql", "evidence.html"));
      await fs.access(path.join(runDir, "steps", "03_browser-date-filter", "screenshot.png"));
    },
    { timeout: 60000 }
  );
});
