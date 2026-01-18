import "dotenv/config";
import { loadPlan } from "./core/plan";
import { executePlan } from "./core/runner";

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) {
    return undefined;
  }
  return process.argv[idx + 1];
}

function readIntArg(flag: string): number | undefined {
  const value = readArg(flag);
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readStringArg(flag: string): string | undefined {
  const value = readArg(flag);
  return value && value.trim() ? value.trim() : undefined;
}

function readStepsArg(): number[] | undefined {
  const raw = readArg("--steps");
  if (!raw) {
    return undefined;
  }
  const values = raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value));
  return values.length > 0 ? Array.from(new Set(values)).sort((a, b) => a - b) : undefined;
}

async function main(): Promise<void> {
  const planPath = readArg("--plan") ?? readArg("-p");
  const planSource = readStringArg("--plan-source");
  const outDir = readArg("--out") ?? readArg("-o") ?? "runs";
  const fromStep = readIntArg("--from");
  const toStep = readIntArg("--to");
  const selectedSteps = readStepsArg();
  const resumeFrom = readStringArg("--resume");

  if (!planPath) {
    console.error("Missing --plan <path>");
    process.exit(2);
    return;
  }

  const plan = await loadPlan(planPath);
  await executePlan(plan, outDir, {
    fromStep,
    toStep,
    planPath: planSource ?? planPath,
    selectedSteps,
    resumeFrom
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
