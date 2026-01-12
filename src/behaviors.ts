import { promises as fs } from "fs";
import path from "path";

export type BehaviorAction =
  | { type: "goto"; url: string }
  | { type: "click"; selector: string }
  | { type: "fill"; selector: string; text: string }
  | { type: "waitForSelector"; selector: string; state?: "attached" | "detached" | "visible" | "hidden" }
  | { type: "waitForTimeout"; ms: number };

export interface BehaviorDefinition {
  actions: BehaviorAction[];
}

export interface BehaviorsFile {
  behaviors: Record<string, BehaviorDefinition>;
}

export type BehaviorMap = Record<string, BehaviorDefinition>;

export async function loadBehaviors(behaviorsPath: string): Promise<BehaviorMap> {
  const absPath = path.resolve(behaviorsPath);
  const raw = await fs.readFile(absPath, "utf-8");
  const parsed = JSON.parse(raw) as BehaviorsFile;

  if (!parsed.behaviors || typeof parsed.behaviors !== "object") {
    throw new Error("Invalid behaviors file: expected behaviors object");
  }

  return parsed.behaviors;
}
