import { promises as fs } from "fs";
import path from "path";
import { Plan } from "./types";
import { validatePlanStructure } from "./plan-validator";

export async function loadPlan(planPath: string): Promise<Plan> {
  const absPath = path.resolve(planPath);
  const raw = await fs.readFile(absPath, "utf-8");

  if (!planPath.toLowerCase().endsWith(".json")) {
    throw new Error("Only .json plan files are supported in the bootstrap");
  }

  const plan = JSON.parse(raw) as Plan;

  const errors = validatePlanStructure(plan);
  if (errors.length > 0) {
    const details = errors.map((error) => `- ${error.path}: ${error.message}`).join("\n");
    throw new Error(`Invalid plan:\n${details}`);
  }

  return plan;
}
