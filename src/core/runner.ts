import { promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";
import { loadBehaviors } from "../domains/browser/behaviors";
import { executeBrowserStep, executeBrowserStepWithSession } from "../domains/browser/browser";
import { BrowserSession, closeSession, createSession } from "../domains/browser/session";
import { Context, resolveTemplatesDeep } from "./context";
import { writeErrorFile, writeErrorPng } from "./errors";
import { applyExports } from "./exports";
import { executeApiStep } from "../domains/api/api";
import { closeSqlConnections, executeSqlEvidenceStep } from "../domains/sql/sql";
import { executeCliStep } from "../domains/cli/cli";
import { executeSpecialistStep } from "../domains/specialist/specialist";
import { executeLogstreamStep } from "../domains/logstream/logstream";
import { Plan, PlanStep, StepResult } from "./types";
import { createRunId, nowIso } from "./utils";

export interface ExecutionOptions {
  fromStep?: number;
  toStep?: number;
  planPath?: string;
  selectedSteps?: number[];
}

export async function executePlan(
  plan: Plan,
  outDir: string,
  options: ExecutionOptions = {}
): Promise<void> {
  const runId = createRunId();
  const runDir = path.resolve(outDir, runId);
  const stepsDir = path.join(runDir, "steps");
  const behaviors = plan.behaviorsPath ? await loadBehaviors(plan.behaviorsPath) : null;
  const curlPath = plan.curlPath ?? "";
  const runStartedAt = nowIso();
  const totalSteps = plan.steps.length;
  const cacheRoot = resolveCacheRoot(plan);
  if (cacheRoot) {
    await fs.mkdir(cacheRoot, { recursive: true });
  }
  const range = normalizeStepRange(totalSteps, options);
  const selectedSet =
    options.selectedSteps && options.selectedSteps.length > 0
      ? new Set(options.selectedSteps)
      : null;
  const context: Context = buildContext(plan, {
    runId,
    startedAt: runStartedAt
  });
  const browserStepsCount = plan.steps.filter((step) => step.type === "browser").length;
  const reuseSession = plan.browser?.reuseSession ?? browserStepsCount > 1;
  const sharedSession: BrowserSession | null = reuseSession
    ? await createSession(plan.browser)
    : null;

  logRunStart(runId, plan, outDir, totalSteps);
  await fs.mkdir(stepsDir, { recursive: true });

  const results: StepResult[] = [];

  try {
    for (let i = 0; i < plan.steps.length; i += 1) {
      const step = plan.steps[i];
      const stepNumber = i + 1;
      if (selectedSet && !selectedSet.has(stepNumber)) {
        continue;
      }
      if (stepNumber < range.fromStep || stepNumber > range.toStep) {
        continue;
      }
      const stepIndex = String(i + 1).padStart(2, "0");
      const loopItems = resolveLoopItems(step, plan);
      if (loopItems.length === 0) {
        const result = await runSingleStep({
          step,
          stepNumber,
          totalSteps,
          stepIndex,
          stepDirRoot: stepsDir,
          plan,
          behaviors,
          curlPath,
          cacheRoot,
          context,
          sharedSession,
          loopInfo: null
        });
        if (result) {
          results.push(result);
        }
        if (result?.status === "FAIL" && (plan.failPolicy ?? "stop") === "stop") {
          break;
        }
        continue;
      }

      for (let loopIndex = 0; loopIndex < loopItems.length; loopIndex += 1) {
        const result = await runSingleStep({
          step,
          stepNumber,
          totalSteps,
          stepIndex,
          stepDirRoot: stepsDir,
          plan,
          behaviors,
          curlPath,
          cacheRoot,
          context,
          sharedSession,
          loopInfo: {
            index: loopIndex,
            total: loopItems.length,
            item: loopItems[loopIndex]
          }
        });
        if (result) {
          results.push(result);
        }
        if (result?.status === "FAIL" && (plan.failPolicy ?? "stop") === "stop") {
          break;
        }
      }
      if ((plan.failPolicy ?? "stop") === "stop" && results.some((item) => item.status === "FAIL")) {
        break;
      }
    }

    const runSummary = {
      runId,
      startedAt: runStartedAt,
      finishedAt: nowIso(),
      planPath: options.planPath ?? null,
      fromStep: options.fromStep ?? null,
      toStep: options.toStep ?? null,
      selectedSteps: options.selectedSteps ?? null,
      feature: plan.metadata.feature,
      ticket: plan.metadata.ticket ?? null,
      env: plan.metadata.env ?? null,
      steps: results,
      loopSummary: buildLoopSummary(results),
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
    if (sharedSession) {
      await closeSession(sharedSession);
    }
    await closeSqlConnections();
  }
}

interface RunSingleStepInput {
  step: PlanStep;
  stepNumber: number;
  totalSteps: number;
  stepIndex: string;
  stepDirRoot: string;
  plan: Plan;
  behaviors: Awaited<ReturnType<typeof loadBehaviors>> | null;
  curlPath: string;
  cacheRoot: string | null;
  context: Context;
  sharedSession: BrowserSession | null;
  loopInfo: { index: number; total: number; item: Context } | null;
}

async function runSingleStep(input: RunSingleStepInput): Promise<StepResult | null> {
  const {
    step,
    stepNumber,
    totalSteps,
    stepIndex,
    stepDirRoot,
    plan,
    behaviors,
    curlPath,
    cacheRoot,
    context,
    sharedSession,
    loopInfo
  } = input;
  const loopSuffix = loopInfo ? `__${String(loopInfo.index + 1).padStart(2, "0")}` : "";
  const stepDirName = `${stepIndex}_${step.id ?? step.type}${loopSuffix}`;
  const stepDir = path.join(stepDirRoot, stepDirName);
  await fs.mkdir(stepDir, { recursive: true });

  const stepStartedAt = nowIso();
  const stepStartMs = Date.now();
  let durationMs = 0;
  let status: StepResult["status"] = "SKIPPED";
  const outputs: Record<string, unknown> = {};
  outputs.stepDir = `steps/${stepDirName}`;
  let notes: string | undefined = "Bootstrap: step execution not implemented yet";
  const errorPath = path.join(stepDir, "error.json");
  const errorPngPath = path.join(stepDir, "error.png");
  let resolvedStep = step;
  let cachedExports: Record<string, unknown> | undefined;
  let cachedOutputs: Record<string, unknown> | undefined;

  const iterationContext = loopInfo
    ? buildIterationContext(context, loopInfo.item, loopInfo.index, loopInfo.total)
    : context;
  const loopLabel = loopInfo ? ` item ${loopInfo.index + 1}/${loopInfo.total}` : "";

  try {
    logStepStart(stepNumber, totalSteps, step, loopLabel);
    ensureRequires(step, iterationContext);
    resolvedStep = resolveTemplatesDeep(step, iterationContext);

    const cacheEnabled = shouldUseCache(cacheRoot, resolvedStep);
    const cacheKey = cacheEnabled
      ? await buildCacheKey(resolvedStep, plan, behaviors, iterationContext, loopInfo?.item ?? null)
      : null;
    if (cacheEnabled && cacheKey) {
      const cacheHit = await readCacheEntry(cacheRoot, cacheKey);
      if (cacheHit) {
        cachedOutputs = cacheHit.outputs;
        cachedExports = cacheHit.exportsPayload;
        await restoreCachedArtifacts(cacheRoot, cacheKey, stepDir, cacheHit.artifacts);
        status = "SKIPPED";
        notes = "cache hit";
        outputs.cacheHit = true;
        outputs.loopIndex = loopInfo ? loopInfo.index + 1 : undefined;
        outputs.loopTotal = loopInfo ? loopInfo.total : undefined;
        outputs.loopItem = loopInfo ? loopInfo.item : undefined;
        Object.assign(outputs, cachedOutputs ?? {});
        outputs.stepDir = `steps/${stepDirName}`;
        durationMs = Date.now() - stepStartMs;
        outputs.durationMs = durationMs;
        if (cachedExports && resolvedStep.exports) {
          applyExports(context, resolvedStep.exports, cachedExports);
        }
        logStepCacheHit(stepNumber, totalSteps, resolvedStep, durationMs, loopLabel);
        await finalizeStep(stepDir, step, resolvedStep, status, stepStartedAt, outputs, durationMs, notes);
        return {
          id: buildStepResultId(resolvedStep, loopInfo),
          type: resolvedStep.type,
          status,
          startedAt: stepStartedAt,
          finishedAt: nowIso(),
          durationMs,
          inputs: resolvedStep,
          outputs,
          notes
        };
      }
    }

    if (resolvedStep.type === "browser") {
      const actions = getBehaviorActions(resolvedStep.behaviorId, behaviors, iterationContext);
      const browserResult = sharedSession
        ? await executeBrowserStepWithSession(resolvedStep, actions, stepDir, sharedSession)
        : await executeBrowserStep(resolvedStep, actions, stepDir, plan.browser);
      status = "OK";
      outputs.screenshot = path.basename(browserResult.screenshotPath);
      if (browserResult.screenshotPaths.length > 1) {
        outputs.screenshots = browserResult.screenshotPaths.map((item) => path.basename(item));
      }
      outputs.attempts = browserResult.attempts;
      outputs.actionTimings = browserResult.actionTimings;
      notes = undefined;
    } else if (resolvedStep.type === "api") {
      const apiResult = await executeApiStep(resolvedStep, curlPath, stepDir, iterationContext);
      status = "OK";
      outputs.evidence = apiResult.evidenceFile;
      if (apiResult.statusCode) {
        outputs.statusCode = apiResult.statusCode;
      }
      if (apiResult.responseData) {
        outputs.responseData = apiResult.responseData;
      }
      const exportsPayload = {
        responseData: apiResult.responseData,
        responseText: typeof apiResult.responseData === "string" ? apiResult.responseData : JSON.stringify(apiResult.responseData)
      };
      applyExports(context, resolvedStep.exports, exportsPayload);
      cachedExports = exportsPayload;
      notes = undefined;
    } else if (resolvedStep.type === "sqlEvidence") {
      const sqlResult = await executeSqlEvidenceStep(resolvedStep, stepDir, iterationContext);
      status = "OK";
      outputs.screenshot = path.basename(sqlResult.screenshotPath);
      outputs.query = sqlResult.queryFile;
      outputs.result = sqlResult.resultFile;
      outputs.evidence = sqlResult.evidenceFile;
      outputs.rows = sqlResult.rows;
      const exportsPayload = {
        sqlRows: sqlResult.rowsData
      };
      applyExports(context, resolvedStep.exports, exportsPayload);
      cachedExports = exportsPayload;
      notes = undefined;
    } else if (resolvedStep.type === "cli") {
      const cliResult = await executeCliStep(resolvedStep, stepDir);
      status = "OK";
      outputs.stdout = cliResult.stdoutFile;
      outputs.stderr = cliResult.stderrFile;
      outputs.evidence = cliResult.evidenceFile;
      outputs.exitCode = cliResult.exitCode;
      outputs.durationMs = cliResult.durationMs;
      const exportsPayload = {
        stdout: cliResult.stdout,
        stderr: cliResult.stderr
      };
      applyExports(context, resolvedStep.exports, exportsPayload);
      cachedExports = exportsPayload;
      notes = undefined;
    } else if (resolvedStep.type === "specialist") {
      const specialistResult = await executeSpecialistStep(resolvedStep, stepDir);
      status = "OK";
      if (specialistResult.relativePath) {
        outputs.file = specialistResult.relativePath;
      }
      outputs.filePath = specialistResult.filePath;
      notes = undefined;
    } else if (resolvedStep.type === "logstream") {
      const logResult = await executeLogstreamStep(resolvedStep, stepDir);
      status = "OK";
      outputs.evidence = logResult.evidenceFile;
      notes = undefined;
    }

    durationMs = Date.now() - stepStartMs;
    if (typeof outputs.durationMs !== "number") {
      outputs.durationMs = durationMs;
    }
    outputs.loopIndex = loopInfo ? loopInfo.index + 1 : undefined;
    outputs.loopTotal = loopInfo ? loopInfo.total : undefined;
    outputs.loopItem = loopInfo ? loopInfo.item : undefined;
    logStepSuccess(stepNumber, totalSteps, resolvedStep, outputs, durationMs, loopLabel);

    if (shouldUseCache(cacheRoot, resolvedStep)) {
      const cacheKey = await buildCacheKey(resolvedStep, plan, behaviors, iterationContext, loopInfo?.item ?? null);
      if (cacheKey) {
        await writeCacheEntry(cacheRoot, cacheKey, resolvedStep, stepDir, outputs, cachedExports);
      }
    }
  } catch (error) {
    status = "FAIL";
    notes = error instanceof Error ? error.message : String(error);
    durationMs = Date.now() - stepStartMs;
    if (typeof outputs.durationMs !== "number") {
      outputs.durationMs = durationMs;
    }
    logStepFailure(stepNumber, totalSteps, step, notes, durationMs, loopLabel);
    await writeErrorFile(errorPath, error);
    await writeErrorPng(errorPngPath);
    if ((plan.failPolicy ?? "stop") === "stop") {
      logStopOnFailure();
      await finalizeStep(stepDir, step, resolvedStep, status, stepStartedAt, outputs, durationMs, notes);
      return {
        id: buildStepResultId(resolvedStep, loopInfo),
        type: resolvedStep.type,
        status,
        startedAt: stepStartedAt,
        finishedAt: nowIso(),
        durationMs,
        inputs: resolvedStep,
        outputs,
        notes
      };
    }
  }

  if (!durationMs) {
    durationMs = Date.now() - stepStartMs;
  }
  const result: StepResult = {
    id: buildStepResultId(resolvedStep, loopInfo),
    type: resolvedStep.type,
    status,
    startedAt: stepStartedAt,
    finishedAt: nowIso(),
    durationMs,
    inputs: resolvedStep,
    outputs,
    notes
  };

  await fs.writeFile(
    path.join(stepDir, "metadata.json"),
    JSON.stringify(result, null, 2),
    "utf-8"
  );

  return result;
}

function resolveLoopItems(step: PlanStep, plan: Plan): Context[] {
  if (step.loop?.items && Array.isArray(step.loop.items)) {
    return step.loop.items.map((item) => normalizeContext(item));
  }
  if (step.loop?.usePlanItems && plan.inputs?.items && Array.isArray(plan.inputs.items)) {
    return plan.inputs.items.map((item) => normalizeContext(item));
  }
  return [];
}

function buildIterationContext(
  base: Context,
  item: Context,
  index: number,
  total: number
): Context {
  return {
    ...base,
    ...normalizeContext(item),
    loopIndex: String(index + 1),
    loopTotal: String(total)
  };
}

function buildStepResultId(step: PlanStep, loopInfo: { index: number } | null): string {
  const baseId = step.id ?? step.type;
  if (!loopInfo) {
    return baseId;
  }
  return `${baseId}__${String(loopInfo.index + 1).padStart(2, "0")}`;
}

function buildContext(plan: Plan, runtime: { runId: string; startedAt: string }): Context {
  const defaults = normalizeContext(plan.inputs?.defaults);
  const planContext = normalizeContext(plan.context);
  const overrides = normalizeContext(plan.inputs?.overrides);
  const envContext = loadEnvContext(plan.inputs?.envPrefix);
  const core = {
    feature: plan.metadata.feature,
    ticket: plan.metadata.ticket ?? "",
    env: plan.metadata.env ?? "",
    runId: runtime.runId,
    startedAt: runtime.startedAt
  };

  return {
    ...defaults,
    ...planContext,
    ...overrides,
    ...envContext,
    ...core
  };
}

function normalizeContext(input?: Context): Context {
  if (!input) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, String(value)])
  );
}

function loadEnvContext(prefix = "AUTO_"): Context {
  const out: Context = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    const normalizedKey = key.slice(prefix.length);
    if (!normalizedKey) {
      continue;
    }
    out[normalizedKey] = value ?? "";
  }
  return out;
}

function normalizeStepRange(totalSteps: number, options: ExecutionOptions) {
  const fromStepRaw = options.fromStep ?? 1;
  const toStepRaw = options.toStep ?? totalSteps;
  const fromStep = Number.isFinite(fromStepRaw) ? Math.floor(fromStepRaw) : 1;
  const toStep = Number.isFinite(toStepRaw) ? Math.floor(toStepRaw) : totalSteps;

  if (fromStep < 1 || toStep < 1 || fromStep > totalSteps || toStep > totalSteps) {
    throw new Error(`Invalid range: fromStep=${fromStep} toStep=${toStep} total=${totalSteps}`);
  }
  if (fromStep > toStep) {
    throw new Error(`Invalid range: fromStep=${fromStep} is greater than toStep=${toStep}`);
  }

  return { fromStep, toStep };
}

function resolveCacheRoot(plan: Plan): string | null {
  if (!plan.cache?.enabled) {
    return null;
  }
  const root = plan.cache.dir
    ? path.resolve(plan.cache.dir)
    : path.join(process.cwd(), ".cache", "steps");
  return root;
}

function shouldUseCache(cacheRoot: string | null, step: PlanStep): boolean {
  if (!cacheRoot) {
    return false;
  }
  if (step.cache === false) {
    return false;
  }
  return true;
}

async function buildCacheKey(
  step: PlanStep,
  plan: Plan,
  behaviors: Awaited<ReturnType<typeof loadBehaviors>> | null,
  context: Context,
  loopItem?: Context | null
): Promise<string | null> {
  const payload: Record<string, unknown> = {
    step,
    failPolicy: plan.failPolicy ?? "stop",
    loopItem: loopItem ?? null
  };

  if (step.type === "browser" && step.behaviorId && behaviors) {
    const actions = getBehaviorActions(step.behaviorId, behaviors, context);
    payload.behavior = actions;
  }

  if (step.type === "api" && plan.curlPath) {
    const curlContent = await readFileSafe(plan.curlPath);
    payload.curl = curlContent;
  }

  if (step.type === "sqlEvidence" && step.config?.sql) {
    const sql = step.config.sql;
    if (sql.queryPath) {
      payload.sqlQuery = await readFileSafe(sql.queryPath);
    } else if (sql.query) {
      payload.sqlQuery = sql.query;
    }
    payload.sqlAdapter = sql.adapter ?? "";
  }

  const hash = createHash("sha256").update(stableStringify(payload)).digest("hex");
  return hash;
}

async function readFileSafe(filePath: string): Promise<string> {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  try {
    return await fs.readFile(resolved, "utf-8");
  } catch (error) {
    return "";
  }
}

async function readCacheEntry(cacheRoot: string | null, key: string) {
  if (!cacheRoot) {
    return null;
  }
  const entryDir = path.join(cacheRoot, key);
  const metaPath = path.join(entryDir, "cache.json");
  try {
    const raw = await fs.readFile(metaPath, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    return null;
  }
}

async function restoreCachedArtifacts(
  cacheRoot: string | null,
  key: string,
  stepDir: string,
  artifacts: string[]
): Promise<void> {
  if (!cacheRoot || !Array.isArray(artifacts)) {
    return;
  }
  const sourceDir = path.join(cacheRoot, key, "artifacts");
  for (const name of artifacts) {
    const source = path.join(sourceDir, name);
    const target = path.join(stepDir, name);
    try {
      await fs.copyFile(source, target);
    } catch (error) {
      // ignore missing artifacts
    }
  }
}

async function writeCacheEntry(
  cacheRoot: string | null,
  key: string,
  step: PlanStep,
  stepDir: string,
  outputs: Record<string, unknown>,
  exportsPayload?: Record<string, unknown>
): Promise<void> {
  if (!cacheRoot) {
    return;
  }
  const entryDir = path.join(cacheRoot, key);
  const artifactsDir = path.join(entryDir, "artifacts");
  await fs.mkdir(artifactsDir, { recursive: true });

  const artifacts = collectArtifactFiles(outputs);
  for (const name of artifacts) {
    const source = path.join(stepDir, name);
    const target = path.join(artifactsDir, name);
    try {
      await fs.copyFile(source, target);
    } catch (error) {
      // ignore missing artifacts
    }
  }

  const cacheMeta = {
    key,
    stepId: step.id ?? step.type,
    type: step.type,
    createdAt: nowIso(),
    outputs,
    exportsPayload: exportsPayload ?? null,
    artifacts
  };
  await fs.writeFile(path.join(entryDir, "cache.json"), JSON.stringify(cacheMeta, null, 2), "utf-8");
}

function collectArtifactFiles(outputs: Record<string, unknown>): string[] {
  const files: string[] = [];
  addArtifactFile(files, outputs.screenshot);
  addArtifactFiles(files, outputs.screenshots);
  addArtifactFile(files, outputs.query);
  addArtifactFile(files, outputs.result);
  addArtifactFile(files, outputs.evidence);
  addArtifactFile(files, outputs.stdout);
  addArtifactFile(files, outputs.stderr);
  return files;
}

function addArtifactFile(list: string[], value: unknown): void {
  if (typeof value === "string" && value.length > 0) {
    list.push(value);
  }
}

function addArtifactFiles(list: string[], value: unknown): void {
  if (!Array.isArray(value)) {
    return;
  }
  value.forEach((item) => {
    if (typeof item === "string" && item.length > 0) {
      list.push(item);
    }
  });
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([key, val]) => `"${key}":${stableStringify(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function logStepCacheHit(
  index: number,
  total: number,
  step: PlanStep,
  durationMs: number,
  suffix = ""
): void {
  const label = step.id ?? step.type;
  console.log(`Step ${String(index).padStart(2, "0")}/${total} ${label}${suffix} SKIPPED (cache) durationMs=${durationMs}`);
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
  console.log(`ðŸš€ Run ${runId} started (${totalSteps} steps) ${metadata}`.trim());
  console.log(`ðŸ“‚ Output: ${path.resolve(outDir)}`);
}

function logStepStart(index: number, total: number, step: PlanStep, suffix = ""): void {
  const label = step.id ?? step.type;
  const details = describeStep(step);
  console.log(`âž¡ï¸  Step ${String(index).padStart(2, "0")}/${total} ${label}${suffix} (${step.type})${details}`);
}

function logStepSuccess(
  index: number,
  total: number,
  step: PlanStep,
  outputs: Record<string, unknown>,
  durationMs: number,
  suffix = ""
): void {
  const label = step.id ?? step.type;
  const outputSummary = describeOutputs(outputs);
  console.log(`Step ${String(index).padStart(2, "0")}/${total} ${label}${suffix} OK${outputSummary} durationMs=${durationMs}`);
}

function logStepFailure(
  index: number,
  total: number,
  step: PlanStep,
  notes: string,
  durationMs: number,
  suffix = ""
): void {
  const label = step.id ?? step.type;
  console.log(`Step ${String(index).padStart(2, "0")}/${total} ${label}${suffix} FAIL: ${notes} durationMs=${durationMs}`);
}

function logStopOnFailure(): void {
  console.log("ðŸ›‘ Stop on failure (failPolicy=stop)");
}

function logRunFinish(runId: string, results: StepResult[]): void {
  const counts = results.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { OK: 0, FAIL: 0, SKIPPED: 0 } as Record<StepResult["status"], number>
  );
  console.log(`ðŸ Run ${runId} finished: OK=${counts.OK} FAIL=${counts.FAIL} SKIPPED=${counts.SKIPPED}`);
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
  addArtifactLink(links, stepDir, outputs.file, "file");
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

function buildLoopSummary(results: StepResult[]) {
  const summary: Record<
    string,
    { total?: number; items: Array<{ index: number; status: StepResult["status"]; outputs: Record<string, unknown> }> }
  > = {};
  for (const result of results) {
    const loopIndex = result.outputs.loopIndex;
    if (typeof loopIndex !== "number") {
      continue;
    }
    const baseId = result.id.split("__")[0];
    if (!summary[baseId]) {
      summary[baseId] = { total: undefined, items: [] };
    }
    const total = result.outputs.loopTotal;
    if (typeof total === "number") {
      summary[baseId].total = total;
    }
    summary[baseId].items.push({
      index: loopIndex,
      status: result.status,
      outputs: result.outputs
    });
  }
  return summary;
}

async function finalizeStep(
  stepDir: string,
  originalStep: PlanStep,
  resolvedStep: PlanStep,
  status: StepResult["status"],
  startedAt: string,
  outputs: Record<string, unknown>,
  durationMs: number,
  notes?: string
): Promise<void> {
  const result: StepResult = {
    id: resolvedStep.id ?? resolvedStep.type,
    type: resolvedStep.type,
    status,
    startedAt,
    finishedAt: nowIso(),
    durationMs,
    inputs: resolvedStep ?? originalStep,
    outputs,
    notes
  };
  await fs.writeFile(path.join(stepDir, "metadata.json"), JSON.stringify(result, null, 2), "utf-8");
}

