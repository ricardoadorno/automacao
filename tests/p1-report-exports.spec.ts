import { describe, expect, it } from "vitest";

const { buildReportDocx, buildReportHtml } = require("../scripts/report");

describe("report exports", () => {
  it("includes evidence urls in HTML output", () => {
    const report = {
      name: "relatorio",
      runId: "20260118001618_2067",
      blocks: [
        { id: "b1", type: "h1", text: "Relatorio" },
        {
          id: "b2",
          type: "evidence",
          label: "Evidence",
          caption: "Legenda",
          runId: "20260118001618_2067",
          stepDir: "steps/01_api-loop__01",
          stepId: "api-loop__01",
          filename: "evidence.html"
        }
      ]
    };
    const html = buildReportHtml(report, { steps: [] }, report.runId);
    expect(html).toContain("/runs/20260118001618_2067/steps/01_api-loop__01/evidence.html");
    expect(html).toContain("Relatorio");
    expect(html).toContain("Legenda");
  });

  it("falls back to run summary when stepDir is missing", () => {
    const report = {
      name: "relatorio",
      runId: "20260118001618_2067",
      blocks: [
        {
          id: "b1",
          type: "evidence",
          label: "Evidence",
          stepId: "api-loop__01",
          filename: "evidence.html"
        }
      ]
    };
    const summary = {
      steps: [
        {
          id: "api-loop__01",
          outputs: { stepDir: "steps/01_api-loop__01" }
        }
      ]
    };
    const html = buildReportHtml(report, summary, report.runId);
    expect(html).toContain("/runs/20260118001618_2067/steps/01_api-loop__01/evidence.html");
  });

  it("embeds text blocks into docx output", () => {
    const report = {
      name: "relatorio",
      runId: "20260118001618_2067",
      blocks: [
        { id: "b1", type: "h1", text: "Relatorio" },
        { id: "b2", type: "p", text: "Conteudo" }
      ]
    };
    const docx = buildReportDocx(report, { steps: [] }, report.runId);
    const xml = docx.toString("utf-8");
    expect(xml).toContain("Relatorio");
    expect(xml).toContain("Conteudo");
  });
});
