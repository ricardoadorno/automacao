import { promises as fs } from "fs";
import path from "path";

export type BehaviorAction =
  | { type: "goto"; url: string }
  | { type: "click"; selector: string }
  | { type: "fill"; selector: string; text: string }
  | { type: "waitForSelector"; selector: string; state?: "attached" | "detached" | "visible" | "hidden" }
  | { type: "waitForRequest"; url?: string; urlRegex?: string; timeoutMs?: number }
  | { type: "waitForResponse"; url?: string; urlRegex?: string; status?: number; timeoutMs?: number }
  | { type: "waitForTimeout"; ms: number }
  | { type: "waitForLoadState"; state?: "load" | "domcontentloaded" | "networkidle" }
  | { type: "scrollTo"; x?: number; y?: number }
  | { type: "scrollBy"; x?: number; y?: number }
  | { type: "setViewport"; width: number; height: number; deviceScaleFactor?: number }
  | { type: "setZoom"; scale: number }
  | { type: "evaluate"; script: string }
  | { type: "search"; text: string };

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
