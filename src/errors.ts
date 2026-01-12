import { promises as fs } from "fs";

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA" +
  "AAC0lEQVR42mP8/x8AAwMCAO7+uZkAAAAASUVORK5CYII=";

export async function writeErrorFile(errorPath: string, error: unknown): Promise<void> {
  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  };
  await fs.writeFile(errorPath, JSON.stringify(payload, null, 2), "utf-8");
}

export async function writeErrorPng(pngPath: string): Promise<void> {
  const buffer = Buffer.from(PNG_1X1_BASE64, "base64");
  await fs.writeFile(pngPath, buffer);
}
