import { loadPlan } from "./plan";
import { executePlan } from "./runner";

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) {
    return undefined;
  }
  return process.argv[idx + 1];
}

async function main(): Promise<void> {
  const planPath = readArg("--plan") ?? readArg("-p");
  const outDir = readArg("--out") ?? readArg("-o") ?? "runs";

  if (!planPath) {
    console.error("Missing --plan <path>");
    process.exit(2);
    return;
  }

  const plan = await loadPlan(planPath);
  await executePlan(plan, outDir);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
