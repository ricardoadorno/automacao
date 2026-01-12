import { promises as fs } from "fs";
import path from "path";

export interface OpenApiSpec {
  paths?: Record<string, Record<string, unknown>>;
  components?: Record<string, unknown>;
  info?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function loadOpenApi(openapiPath: string): Promise<OpenApiSpec> {
  const abs = path.resolve(openapiPath);
  const raw = await fs.readFile(abs, "utf-8");
  return JSON.parse(raw) as OpenApiSpec;
}

export function hasOperationId(spec: OpenApiSpec, operationId: string): boolean {
  if (!spec.paths) {
    return false;
  }
  for (const pathItem of Object.values(spec.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (operation && typeof operation === "object" && (operation as { operationId?: string }).operationId === operationId) {
        return true;
      }
    }
  }
  return false;
}

export function hasPathMethod(spec: OpenApiSpec, pathKey: string, method: string): boolean {
  if (!spec.paths) {
    return false;
  }
  const normalizedMethod = method.toLowerCase();
  const pathItem = spec.paths[pathKey];
  if (!pathItem || typeof pathItem !== "object") {
    return false;
  }
  return Boolean((pathItem as Record<string, unknown>)[normalizedMethod]);
}
