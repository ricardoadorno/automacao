import { promises as fs } from "fs";
import path from "path";
import { Plan } from "./types";

export async function loadPlan(planPath: string): Promise<Plan> {
  const absPath = path.resolve(planPath);
  const raw = await fs.readFile(absPath, "utf-8");

  if (!planPath.toLowerCase().endsWith(".json")) {
    throw new Error("Only .json plan files are supported in the bootstrap");
  }

  const plan = JSON.parse(raw) as Plan;

  if (!plan.metadata || !plan.steps || !Array.isArray(plan.steps)) {
    throw new Error("Invalid plan: expected metadata and steps[]");
  }

  return plan;
}
