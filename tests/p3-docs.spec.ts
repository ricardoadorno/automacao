/// <reference types="vitest" />
import { describe, expect, it } from "vitest";

const { buildReportDocx, buildReportHtml } = require("../scripts/report") as {
  buildReportDocx: (report: Record<string, unknown>, runSummary: Record<string, unknown>, runId: string) => Buffer;
  buildReportHtml: (report: Record<string, unknown>, runSummary: Record<string, unknown>, runId: string) => string;
};

describe("P3 report docs", () => {
  it("generates html preview and docx buffer", () => {
    const runSummary = {
      steps: [
        {
          id: "login-api",
          type: "api",
          status: "OK",
          outputs: {
            stepDir: "steps/01_login-api",
            evidence: "evidence.html"
          }
        }
      ]
    };
    const report = {
      name: "Relatorio",
      runId: "run-123",
      blocks: [
        { id: "title", type: "h1", text: "Relatorio de Evidencias" },
        {
          id: "ev-1",
          type: "evidence",
          label: "Login API",
          stepId: "login-api",
          filename: "evidence.html"
        }
      ]
    };

    const html = buildReportHtml(report, runSummary, "run-123");
    expect(html).toContain("Relatorio de Evidencias");
    expect(html).toContain("evidence.html");
    expect(html).toContain("/runs/run-123/steps/01_login-api/evidence.html");

    const docx = buildReportDocx(report, runSummary, "run-123");
    expect(docx.slice(0, 2).toString("utf-8")).toBe("PK");
    expect(docx.includes(Buffer.from("word/document.xml"))).toBe(true);
  });
});
