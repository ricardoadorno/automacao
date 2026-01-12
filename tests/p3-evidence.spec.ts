/// <reference types="vitest" />
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { executeApiStep } from "../src/domains/api/api";
import { executeCliStep } from "../src/domains/cli/cli";
import { PlanStep } from "../src/core/types";

describe("P3 evidence html", () => {
  it("renders API evidence html", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "api");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "api"
    };

    const curlPath = path.join(stepDir, "test.curl");
    await fs.writeFile(
      curlPath,
      "curl 'https://api.example.com/todos/1' -H 'Accept: application/json'",
      "utf-8"
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      ({
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        text: async () => JSON.stringify({ id: 1, title: "hello" })
      }) as Response;

    try {
      const result = await executeApiStep(step, curlPath, stepDir, {});
      const html = await fs.readFile(path.join(stepDir, result.evidenceFile), "utf-8");

      expect(html).toContain("API Evidence");
      expect(html).toContain("GET");
      expect(html).toContain("api.example.com");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("renders CLI evidence html", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "automacao-"));
    const stepDir = path.join(tempRoot, "cli");
    await fs.mkdir(stepDir, { recursive: true });

    const step: PlanStep = {
      type: "cli",
      config: {
        cli: {
          command: process.execPath,
          args: ["-e", "console.log('ok'); console.error('err');"]
        }
      }
    };

    const result = await executeCliStep(step, stepDir);
    const html = await fs.readFile(path.join(stepDir, result.evidenceFile), "utf-8");
    const normalized = normalizeCliHtml(html);

    expect(normalized).toContain("<h2>CLI Evidence");
    expect(normalized).toContain("<h3>Stdout");
    expect(normalized).toContain("<h3>Stderr");
  });
});

function normalizeCliHtml(html: string): string {
  const normalizedPath = html.replace(/[A-Za-z]:\\[^<\n]*?node\.exe/g, "node");
  const durationRow = normalizedPath.replace(
    /<tr><th>DurationMs<\/th><td>\d+<\/td><\/tr>/g,
    "<tr><th>DurationMs</th><td>X</td></tr>"
  );
  return durationRow.replace(
    /(<tr>\s*<td>.*?<\/td>\s*<td>.*?<\/td>\s*<td>\d+<\/td>\s*<td>)\d+(<\/td>\s*<\/tr>)/g,
    "$1X$2"
  );
}
