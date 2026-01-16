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

  const isAbsolute = path.isAbsolute(config.outputPath);
  let targetPath = isAbsolute
    ? config.outputPath
    : path.join(stepDir, config.outputPath);

  if (config.task === "appendFile" && !isAbsolute) {
    const exists = await fileExists(targetPath);
    if (!exists) {
      const existing = await findExistingStepFile(stepDir, config.outputPath);
      if (existing) {
        targetPath = existing;
      }
    }
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  if (config.task === "writeFile") {
    await fs.writeFile(targetPath, config.content ?? "", "utf-8");
  } else if (config.task === "appendFile") {
    await fs.appendFile(targetPath, config.content ?? "", "utf-8");
  } else if (config.task === "writeJson") {
    const content = JSON.stringify(config.data ?? null, null, 2);
    await fs.writeFile(targetPath, content, "utf-8");
  } else {
    throw new Error(`Unsupported specialist task: ${config.task}`);
  }

  return {
    filePath: targetPath,
    fileName: path.basename(targetPath),
    relativePath: isAbsolute ? undefined : path.relative(stepDir, targetPath)
  };
}

async function fileExists(targetPath: string) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function findExistingStepFile(stepDir: string, relativePath: string) {
  const stepsDir = path.dirname(stepDir);
  try {
    const entries = await fs.readdir(stepsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(stepsDir, entry.name, relativePath);
      if (await fileExists(candidate)) {
        return candidate;
      }
    }
  } catch {
    return null;
  }
  return null;
}
