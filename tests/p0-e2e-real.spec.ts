/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { executePlan } from "../src/core/runner";
import { loadPlan } from "../src/core/plan";

describe("P0 e2e real runner", () => {
  it(
    "executes examples/quickstart/plan.json end-to-end",
    async () => {
      const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
      const outDir = path.join(tempRoot, "runs");
      const plan = await loadPlan("examples/quickstart/plan.json");

      await executePlan(plan, outDir);

      const runDir = path.join(outDir, (await fs.readdir(outDir))[0]);
      await fs.access(path.join(runDir, "index.html"));
      await fs.access(path.join(runDir, "steps", "01_cli-echo", "evidence.html"));
      await fs.access(path.join(runDir, "steps", "02_write-file", "note.txt"));
    },
    { timeout: 60000 }
  );
});
