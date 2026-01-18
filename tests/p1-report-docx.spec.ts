import { describe, expect, it } from "vitest";

const { buildReportDocx, buildReportHtml } = require("../scripts/report");

describe("report exports", () => {
  it("renders HTML with enabled defaults", () => {
    const report = {
      name: "demo",
      runId: "run-1",
      blocks: [
        { id: "b1", type: "h1", text: "Hello Report" },
        { id: "b2", type: "p", text: "Body text" }
      ]
    };
    const html = buildReportHtml(report, { steps: [] }, "run-1");
    expect(html).toContain("Hello Report");
    expect(html).toContain("Body text");
  });

  it("renders DOCX content with text blocks", () => {
    const report = {
      name: "demo",
      runId: "run-1",
      blocks: [
        { id: "b1", type: "h1", text: "Docx Title" },
        { id: "b2", type: "p", text: "Docx Body" }
      ]
    };
    const docx = buildReportDocx(report, { steps: [] }, "run-1");
    expect(Buffer.isBuffer(docx)).toBe(true);
    const content = docx.toString("utf-8");
    expect(content).toContain("Docx Title");
    expect(content).toContain("Docx Body");
  });
});
