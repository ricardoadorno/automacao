import { promises as fs } from "fs";
import path from "path";
import { PlanStep } from "../../core/types";

export interface SpecialistResult {
  filePath: string;
  fileName: string;
  relativePath?: string;
}

export async function executeSpecialistStep(
  step: PlanStep,
  stepDir: string
): Promise<SpecialistResult> {
  const config = step.config?.specialist;
  if (!config) {
    throw new Error("specialist config is required");
  }
  if (config.task !== "writeFile") {
    throw new Error(`Unsupported specialist task: ${config.task}`);
  }

  const isAbsolute = path.isAbsolute(config.outputPath);
  const targetPath = isAbsolute
    ? config.outputPath
    : path.join(stepDir, config.outputPath);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, config.content ?? "", "utf-8");

  return {
    filePath: targetPath,
    fileName: path.basename(targetPath),
    relativePath: isAbsolute ? undefined : config.outputPath
  };
}
