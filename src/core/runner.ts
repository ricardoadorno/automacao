import { promises as fs } from "fs";
import path from "path";
import { loadBehaviors } from "../domains/browser/behaviors";
import { executeBrowserStep } from "../domains/browser/browser";
import { Context, resolveTemplatesDeep } from "./context";
import { writeErrorFile, writeErrorPng } from "./errors";
import { applyExports } from "./exports";
import { executeApiStep } from "../domains/api/api";
import { closeSqlConnections, executeSqlEvidenceStep } from "../domains/sql/sql";
import { executeCliStep } from "../domains/cli/cli";
import { Plan, PlanStep, StepResult } from "./types";
import { createRunId, nowIso } from "./utils";

export async function executePlan(plan: Plan, outDir: string): Promise<void> {
  const runId = createRunId();
  const runDir = path.resolve(outDir, runId);
  const stepsDir = path.join(runDir, "steps");
  const behaviors = plan.behaviorsPath ? await loadBehaviors(plan.behaviorsPath) : null;
  const curlPath = plan.curlPath ?? "";
  const runStartedAt = nowIso();
  const totalSteps = plan.steps.length;
  const context: Context = {
    feature: plan.metadata.feature,
    ticket: plan.metadata.ticket ?? "",
    env: plan.metadata.env ?? "",
    runId,
    startedAt: runStartedAt,
    ...(plan.context ?? {})
  };

  logRunStart(runId, plan, outDir, totalSteps);
  await fs.mkdir(stepsDir, { recursive: true });

  const results: StepResult[] = [];

  try {
    for (let i = 0; i < plan.steps.length; i += 1) {
      const step = plan.steps[i];
      const stepIndex = String(i + 1).padStart(2, "0");
      const stepDirName = `${stepIndex}_${step.id ?? step.type}`;
      const stepDir = path.join(stepsDir, stepDirName);

      await fs.mkdir(stepDir, { recursive: true });

      const stepStartedAt = nowIso();
      let status: StepResult["status"] = "SKIPPED";
      const outputs: Record<string, unknown> = {};
      outputs.stepDir = `steps/${stepDirName}`;
      let notes: string | undefined = "Bootstrap: step execution not implemented yet";
      const errorPath = path.join(stepDir, "error.json");
      const errorPngPath = path.join(stepDir, "error.png");
      let resolvedStep = step;

      try {
        logStepStart(i + 1, totalSteps, step);
        ensureRequires(step, context);
        resolvedStep = resolveTemplatesDeep(step, context);

        if (resolvedStep.type === "browser") {
          const actions = getBehaviorActions(resolvedStep.behaviorId, behaviors, context);
          const browserResult = await executeBrowserStep(resolvedStep, actions, stepDir, plan.browser);
          status = "OK";
          outputs.screenshot = path.basename(browserResult.screenshotPath);
          if (browserResult.screenshotPaths.length > 1) {
            outputs.screenshots = browserResult.screenshotPaths.map((item) => path.basename(item));
          }
          outputs.attempts = browserResult.attempts;
          notes = undefined;
        } else if (resolvedStep.type === "api") {
          const apiResult = await executeApiStep(resolvedStep, curlPath, stepDir, context);
          status = "OK";
          outputs.evidence = apiResult.evidenceFile;
          if (apiResult.statusCode) {
            outputs.statusCode = apiResult.statusCode;
          }
          if (apiResult.responseData) {
            outputs.responseData = apiResult.responseData;
          }
          applyExports(context, resolvedStep.exports, { 
            responseData: apiResult.responseData,
            responseText: typeof apiResult.responseData === "string" ? apiResult.responseData : JSON.stringify(apiResult.responseData)
          });
          notes = undefined;
        } else if (resolvedStep.type === "sqlEvidence") {
          const sqlResult = await executeSqlEvidenceStep(resolvedStep, stepDir, context);
          status = "OK";
          outputs.screenshot = path.basename(sqlResult.screenshotPath);
          outputs.query = sqlResult.queryFile;
          outputs.result = sqlResult.resultFile;
          outputs.evidence = sqlResult.evidenceFile;
          outputs.rows = sqlResult.rows;
          applyExports(context, resolvedStep.exports, {
            sqlRows: sqlResult.rowsData
          });
          notes = undefined;
        } else if (resolvedStep.type === "cli") {
          const cliResult = await executeCliStep(resolvedStep, stepDir);
          status = "OK";
          outputs.stdout = cliResult.stdoutFile;
          outputs.stderr = cliResult.stderrFile;
          outputs.evidence = cliResult.evidenceFile;
          outputs.exitCode = cliResult.exitCode;
          outputs.durationMs = cliResult.durationMs;
          applyExports(context, resolvedStep.exports, {
            stdout: cliResult.stdout,
            stderr: cliResult.stderr
          });
          notes = undefined;
        }
        logStepSuccess(i + 1, totalSteps, resolvedStep, outputs);
      } catch (error) {
        status = "FAIL";
        notes = error instanceof Error ? error.message : String(error);
        logStepFailure(i + 1, totalSteps, step, notes);
        await writeErrorFile(errorPath, error);
        await writeErrorPng(errorPngPath);
        if ((plan.failPolicy ?? "stop") === "stop") {
          logStopOnFailure();
          await finalizeStep(stepDir, step, resolvedStep, status, stepStartedAt, outputs, notes);
          results.push({
            id: resolvedStep.id ?? resolvedStep.type,
            type: resolvedStep.type,
            status,
            startedAt: stepStartedAt,
            finishedAt: nowIso(),
            inputs: resolvedStep,
            outputs,
            notes
          });
          break;
        }
      }

      const result: StepResult = {
        id: resolvedStep.id ?? resolvedStep.type,
        type: resolvedStep.type,
        status,
        startedAt: stepStartedAt,
        finishedAt: nowIso(),
        inputs: resolvedStep,
        outputs,
        notes
      };

      await fs.writeFile(
        path.join(stepDir, "metadata.json"),
        JSON.stringify(result, null, 2),
        "utf-8"
      );

      results.push(result);
    }

    const runSummary = {
      runId,
      startedAt: runStartedAt,
      finishedAt: nowIso(),
      feature: plan.metadata.feature,
      ticket: plan.metadata.ticket ?? null,
      env: plan.metadata.env ?? null,
      steps: results,
      context
    };

    await fs.writeFile(
      path.join(runDir, "00_runSummary.json"),
      JSON.stringify(runSummary, null, 2),
      "utf-8"
    );

    const indexHtml = buildIndexHtml(runSummary);
    await fs.writeFile(path.join(runDir, "index.html"), indexHtml, "utf-8");
    logRunFinish(runId, results);
  } finally {
    await closeSqlConnections();
  }
}

function buildIndexHtml(summary: { runId: string; steps: StepResult[] }): string {
  const rows = summary.steps
    .map((step) => {
      const artifacts = renderArtifacts(step.outputs);
      return `<tr><td>${step.id}</td><td>${step.type}</td><td>${step.status}</td><td>${artifacts}</td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Run ${summary.runId}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 8px; }
    th { background: #f5f5f5; text-align: left; }
    td .artifact { margin-right: 8px; display: inline-block; }
  </style>
</head>
<body>
  <h1>Run ${summary.runId}</h1>
  <table>
    <thead>
      <tr><th>Step</th><th>Type</th><th>Status</th><th>Artifacts</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

function ensureRequires(step: PlanStep, context: Context): void {
  if (!step.requires) {
    return;
  }
  for (const key of step.requires) {
    if (!context[key]) {
      throw new Error(`Missing required context value: ${key}`);
    }
  }
}

function getBehaviorActions(
  behaviorId: string | undefined,
  behaviors: Awaited<ReturnType<typeof loadBehaviors>> | null,
  context: Context
) {
  if (!behaviorId) {
    throw new Error("step requires behaviorId");
  }
  if (!behaviors) {
    throw new Error("behaviorsPath is required for browser-like steps");
  }
  const behavior = behaviors[behaviorId];
  if (!behavior) {
    throw new Error(`behavior not found: ${behaviorId}`);
  }
  return resolveTemplatesDeep(behavior.actions, context);
}

function logRunStart(runId: string, plan: Plan, outDir: string, totalSteps: number): void {
  const metadata = [
    `feature=${plan.metadata.feature}`,
    plan.metadata.ticket ? `ticket=${plan.metadata.ticket}` : null,
    plan.metadata.env ? `env=${plan.metadata.env}` : null
  ]
    .filter(Boolean)
    .join(" ");
  console.log(`🚀 Run ${runId} started (${totalSteps} steps) ${metadata}`.trim());
  console.log(`📂 Output: ${path.resolve(outDir)}`);
}

function logStepStart(index: number, total: number, step: PlanStep): void {
  const label = step.id ?? step.type;
  const details = describeStep(step);
  console.log(`➡️  Step ${String(index).padStart(2, "0")}/${total} ${label} (${step.type})${details}`);
}

function logStepSuccess(
  index: number,
  total: number,
  step: PlanStep,
  outputs: Record<string, unknown>
): void {
  const label = step.id ?? step.type;
  const outputSummary = describeOutputs(outputs);
  console.log(`✅ Step ${String(index).padStart(2, "0")}/${total} ${label} OK${outputSummary}`);
}

function logStepFailure(index: number, total: number, step: PlanStep, notes: string): void {
  const label = step.id ?? step.type;
  console.log(`❌ Step ${String(index).padStart(2, "0")}/${total} ${label} FAIL: ${notes}`);
}

function logStopOnFailure(): void {
  console.log("🛑 Stop on failure (failPolicy=stop)");
}

function logRunFinish(runId: string, results: StepResult[]): void {
  const counts = results.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { OK: 0, FAIL: 0, SKIPPED: 0 } as Record<StepResult["status"], number>
  );
  console.log(`🏁 Run ${runId} finished: OK=${counts.OK} FAIL=${counts.FAIL} SKIPPED=${counts.SKIPPED}`);
}

function describeStep(step: PlanStep): string {
  if (step.type === "browser") {
    const parts = [
      step.behaviorId ? `behavior=${step.behaviorId}` : null,
      step.config?.retries !== undefined ? `retries=${step.config.retries}` : null
    ].filter(Boolean);
    return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
  }

  if (step.type === "api") {
    const parts = [
      step.behaviorId ? `behavior=${step.behaviorId}` : null
    ].filter(Boolean);
    return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
  }

  if (step.type === "sqlEvidence") {
    const sql = step.config?.sql;
    if (!sql) {
      return "";
    }
    const parts = [
      sql.adapter === "sqlite" ? "adapter=sqlite" : null,
      sql.queryPath ? `query=${path.basename(sql.queryPath)}` : null,
      sql.resultPath ? `result=${path.basename(sql.resultPath)}` : null,
      sql.dbPath ? `db=${path.basename(sql.dbPath)}` : null,
      sql.expectRows !== undefined ? `expectRows=${sql.expectRows}` : null
    ].filter(Boolean);
    return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
  }

  if (step.type === "cli") {
    const cli = step.config?.cli;
    if (!cli) {
      return "";
    }
    const parts = [
      cli.command ? `command=${path.basename(cli.command)}` : null,
      cli.cwd ? `cwd=${path.basename(cli.cwd)}` : null,
      cli.timeoutMs !== undefined ? `timeoutMs=${cli.timeoutMs}` : null
    ].filter(Boolean);
    return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
  }

  return "";
}

function describeOutputs(outputs: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof outputs.rows === "number") {
    parts.push(`rows=${outputs.rows}`);
  }
  if (typeof outputs.attempts === "number") {
    parts.push(`attempts=${outputs.attempts}`);
  }
  if (typeof outputs.screenshot === "string") {
    parts.push(`screenshot=${outputs.screenshot}`);
  }
  if (typeof outputs.exitCode === "number") {
    parts.push(`exitCode=${outputs.exitCode}`);
  }
  return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
}

function renderArtifacts(outputs: Record<string, unknown>): string {
  const stepDir = typeof outputs.stepDir === "string" ? outputs.stepDir : "";
  if (!stepDir) {
    return "-";
  }
  const links: string[] = [];
  addArtifactLink(links, stepDir, outputs.screenshot, "screenshot");
  addArtifactLinks(links, stepDir, outputs.screenshots, "screenshot");
  addArtifactLink(links, stepDir, outputs.query, "query");
  addArtifactLink(links, stepDir, outputs.result, "result");
  addArtifactLink(links, stepDir, outputs.evidence, "evidence");
  addArtifactLink(links, stepDir, outputs.stdout, "stdout");
  addArtifactLink(links, stepDir, outputs.stderr, "stderr");
  return links.length > 0 ? links.join("") : "-";
}

function addArtifactLink(
  links: string[],
  stepDir: string,
  filename: unknown,
  label: string
): void {
  if (typeof filename !== "string" || filename.length === 0) {
    return;
  }
  const href = `${stepDir}/${filename}`;
  links.push(`<a class="artifact" href="${href}">${label}</a>`);
}

function addArtifactLinks(
  links: string[],
  stepDir: string,
  filenames: unknown,
  label: string
): void {
  if (!Array.isArray(filenames)) {
    return;
  }
  for (const name of filenames) {
    if (typeof name !== "string" || name.length === 0) {
      continue;
    }
    const href = `${stepDir}/${name}`;
    links.push(`<a class="artifact" href="${href}">${label}</a>`);
  }
}

async function finalizeStep(
  stepDir: string,
  originalStep: PlanStep,
  resolvedStep: PlanStep,
  status: StepResult["status"],
  startedAt: string,
  outputs: Record<string, unknown>,
  notes?: string
): Promise<void> {
  const result: StepResult = {
    id: resolvedStep.id ?? resolvedStep.type,
    type: resolvedStep.type,
    status,
    startedAt,
    finishedAt: nowIso(),
    inputs: resolvedStep ?? originalStep,
    outputs,
    notes
  };
  await fs.writeFile(path.join(stepDir, "metadata.json"), JSON.stringify(result, null, 2), "utf-8");
}
