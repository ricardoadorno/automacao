import { existsSync, promises as fs } from "fs";
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
import { executeTabularStep } from "../domains/tabular/tabular";
import { Plan, PlanStep, StepResult } from "./types";
import { createRunId, nowIso } from "./utils";

export interface ExecutionOptions {
  fromStep?: number;
  toStep?: number;
  planPath?: string;
  selectedSteps?: number[];
  resumeFrom?: string;
}

export async function executePlan(
  plan: Plan,
  outDir: string,
  options: ExecutionOptions = {}
): Promise<void> {
  const runId = createRunId();
  const runDir = path.resolve(outDir, runId);
  const stepsDir = path.join(runDir, "steps");
  const behaviorsPath = plan.behaviorsPath
    ? resolveAssetPath(plan.behaviorsPath, options.planPath)
    : "";
  const behaviors = behaviorsPath ? await loadBehaviors(behaviorsPath) : null;
  const curlPath = plan.curlPath ? resolveAssetPath(plan.curlPath, options.planPath) : "";
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
  const resumeContext = options.resumeFrom
    ? await loadResumeContext(options.resumeFrom, outDir)
    : null;
  const context: Context = buildContext(
    plan,
    {
      runId,
      startedAt: runStartedAt
    },
    resumeContext ?? undefined
  );
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
      resumeFrom: options.resumeFrom ?? null,
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
    const cacheInfo = cacheEnabled
      ? await buildCacheInfo(
          resolvedStep,
          plan,
          behaviors,
          iterationContext,
          loopInfo?.item ?? null,
          curlPath
        )
      : null;
    const cacheKey = cacheInfo?.key ?? null;
    if (cacheInfo) {
      outputs.cacheKey = cacheInfo.key;
      outputs.cacheInputs = cacheInfo.inputs;
    }
    if (cacheEnabled && cacheKey) {
      const cacheHit = await readCacheEntry(cacheRoot, cacheKey);
      if (cacheHit) {
        cachedOutputs = cacheHit.outputs;
        cachedExports = cacheHit.exportsPayload;
        await restoreCachedArtifacts(cacheRoot, cacheKey, stepDir, cacheHit.artifacts);
        status = "SKIPPED";
        notes = "cache hit";
        outputs.cacheHit = true;
        outputs.cacheReason = "cache hit";
        outputs.loopIndex = loopInfo ? loopInfo.index + 1 : undefined;
        outputs.loopTotal = loopInfo ? loopInfo.total : undefined;
        outputs.loopItem = loopInfo ? loopInfo.item : undefined;
        Object.assign(outputs, cachedOutputs ?? {});
        if (cacheHit.inputs) {
          outputs.cacheInputs = cacheHit.inputs;
        }
        outputs.stepDir = `steps/${stepDirName}`;
        durationMs = Date.now() - stepStartMs;
        outputs.durationMs = durationMs;
        if (cachedExports && resolvedStep.exports) {
          applyExports(context, resolvedStep.exports, cachedExports);
        }
        const cacheInputsSummary = summarizeCacheInputs(cacheHit.inputs ?? cacheInfo?.inputs ?? null);
        logStepCacheHit(stepNumber, totalSteps, resolvedStep, durationMs, cacheKey ?? "", cacheInputsSummary, loopLabel);
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
    } else if (resolvedStep.type === "tabular") {
      const tabularResult = await executeTabularStep(resolvedStep, stepDir);
      status = "OK";
      outputs.viewer = tabularResult.viewerFile;
      outputs.source = tabularResult.sourceFile;
      if (tabularResult.screenshotPath) {
        outputs.screenshot = path.basename(tabularResult.screenshotPath);
      }
      if (typeof tabularResult.rows === "number") {
        outputs.rows = tabularResult.rows;
      }
      if (typeof tabularResult.columns === "number") {
        outputs.columns = tabularResult.columns;
      }
      if (tabularResult.sheet !== null && tabularResult.sheet !== undefined) {
        outputs.sheet = tabularResult.sheet;
      }
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
      const cacheKey = cacheInfo?.key;
      if (cacheKey) {
        await writeCacheEntry(
          cacheRoot,
          cacheKey,
          resolvedStep,
          stepDir,
          outputs,
          cachedExports,
          cacheInfo?.inputs ?? null
        );
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
    outputs.error = path.basename(errorPath);
    outputs.errorScreenshot = path.basename(errorPngPath);
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

function buildContext(
  plan: Plan,
  runtime: { runId: string; startedAt: string },
  resumeContext?: Context
): Context {
  const base = normalizeContext(resumeContext);
  const defaults = normalizeContext(plan.inputs?.defaults);
  const overrides = normalizeContext(plan.inputs?.overrides);
  const planContext = normalizeContext(plan.context);
  const envContext = loadEnvContext(plan.inputs?.envPrefix);
  const core = {
    feature: plan.metadata.feature,
    ticket: plan.metadata.ticket ?? "",
    env: plan.metadata.env ?? "",
    runId: runtime.runId,
    startedAt: runtime.startedAt
  };

  return {
    ...base,
    ...defaults,
    ...overrides,
    ...planContext,
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
function resolveAssetPath(assetPath: string, planPath?: string | null): string {
  if (path.isAbsolute(assetPath)) {
    return assetPath;
  }
  const fromCwd = path.resolve(process.cwd(), assetPath);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }
  if (planPath) {
    const planDir = path.dirname(path.resolve(planPath));
    return path.resolve(planDir, assetPath);
  }
  return path.resolve(assetPath);
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

async function buildCacheInfo(
  step: PlanStep,
  plan: Plan,
  behaviors: Awaited<ReturnType<typeof loadBehaviors>> | null,
  context: Context,
  loopItem?: Context | null,
  curlPath?: string
): Promise<{ key: string; inputs: Record<string, unknown> } | null> {
  const inputs = await buildCachePayload(step, plan, behaviors, context, loopItem, curlPath);
  const key = createHash("sha256").update(stableStringify(inputs)).digest("hex");
  return { key, inputs };
}

async function buildCachePayload(
  step: PlanStep,
  plan: Plan,
  behaviors: Awaited<ReturnType<typeof loadBehaviors>> | null,
  context: Context,
  loopItem?: Context | null,
  curlPath?: string
): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {
    step,
    failPolicy: plan.failPolicy ?? "stop",
    loopItem: loopItem ?? null
  };

  if (step.type === "browser" && step.behaviorId && behaviors) {
    const actions = getBehaviorActions(step.behaviorId, behaviors, context);
    payload.behavior = actions;
  }

  if (step.type === "api" && curlPath) {
    const curlContent = await readFileSafe(curlPath);
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

  if (step.type === "tabular" && step.config?.tabular) {
    const tabular = step.config.tabular;
    payload.tabularSource = await readFileSafe(tabular.sourcePath);
    payload.tabularFormat = tabular.format ?? "";
    payload.tabularSheet = tabular.sheet ?? null;
    payload.tabularMaxRows = tabular.maxRows ?? null;
    payload.tabularViewer = tabular.viewer ?? null;
  }

  return payload;
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
  exportsPayload?: Record<string, unknown>,
  cacheInputs?: Record<string, unknown> | null
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
    inputs: cacheInputs ?? null,
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
  addArtifactFile(files, outputs.viewer);
  addArtifactFile(files, outputs.source);
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
function summarizeCacheInputs(inputs: Record<string, unknown> | null): string {
  if (!inputs) {
    return "";
  }
  const keys = Object.keys(inputs);
  return keys.length > 0 ? keys.join(",") : "";
}


function logStepCacheHit(
  index: number,
  total: number,
  step: PlanStep,
  durationMs: number,
  cacheKey: string,
  cacheInputsSummary: string,
  suffix = ""
): void {
  const label = step.id ?? step.type;
  const cacheTag = cacheKey ? ` cacheKey=${cacheKey}` : "";
  const inputsTag = cacheInputsSummary ? ` cacheInputs=${cacheInputsSummary}` : "";
  console.log(`Step ${String(index).padStart(2, "0")}/${total} ${label}${suffix} SKIPPED (cache) durationMs=${durationMs}${cacheTag}${inputsTag}`);
}

function buildIndexHtml(summary: { runId: string; steps: StepResult[] }): string {
  const rows = summary.steps
    .map((step) => {
      const artifacts = renderArtifacts(step.outputs);
      const statusClass =
        step.status === "OK" ? "ok" : step.status === "FAIL" ? "fail" : "skipped";
      return `<tr>
        <td>
          <div class="step-cell">
            <span class="step-id">${escapeHtml(step.id ?? "-")}</span>
            <span class="step-type">${escapeHtml(step.type)}</span>
          </div>
        </td>
        <td><span class="status status--${statusClass}">${escapeHtml(step.status)}</span></td>
        <td>${artifacts}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Run ${summary.runId}</title>
  <style>
    :root {
      --color-primary: #FFC107;
      --color-primary-hover: #EBB006;
      --color-navy: #005696;
      --color-navy-dark: #003D6B;
      --color-bg: #F5F7FA;
      --color-surface: #FFFFFF;
      --color-border: #E0E0E0;
      --color-text-main: #212121;
      --color-text-secondary: #616161;
      --color-success: #28A745;
      --color-error: #DC3545;
      --color-warning: #FF9800;
      --font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --font-size-h1: 24px;
      --font-size-h2: 18px;
      --font-size-body: 14px;
      --font-size-small: 12px;
      --font-weight-bold: 700;
      --font-weight-regular: 400;
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
      --radius-md: 8px;
      --radius-sm: 4px;
      --shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.05);
      --shadow-modal: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-body);
      background: var(--color-bg);
      color: var(--color-text-main);
    }

    header {
      background: var(--color-navy);
      color: #FFFFFF;
      padding: var(--spacing-lg);
    }

    header h1 {
      margin: 0 0 var(--spacing-xs);
      font-size: var(--font-size-h1);
    }

    header p {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: var(--font-size-small);
    }

    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-subtle);
      padding: var(--spacing-md);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-body);
    }

    th, td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid var(--color-border);
      vertical-align: top;
    }

    th {
      font-size: var(--font-size-small);
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--color-text-secondary);
      background: #FAFAFA;
    }

    .step-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step-id {
      font-weight: var(--font-weight-bold);
      color: var(--color-navy);
    }

    .step-type {
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
    }

    .status {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
    }

    .status--ok { background: #E8F5E9; color: var(--color-success); }
    .status--fail { background: #FFEBEE; color: var(--color-error); }
    .status--skipped { background: #FFF3E0; color: var(--color-warning); }

    .artifact-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .artifact-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      background: #FFFFFF;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;
    }

    .artifact-title {
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-main);
    }

    .artifact-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .btn {
      font-family: var(--font-family);
      font-weight: var(--font-weight-bold);
      font-size: 11px;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-transform: uppercase;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn--primary { background: var(--color-primary); color: var(--color-navy); }
    .btn--primary:hover { background: var(--color-primary-hover); }
    .btn--secondary { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-main); }
    .btn--ghost { background: transparent; color: var(--color-navy); padding: 4px 8px; }
    .btn--ghost:hover { text-decoration: underline; }

    .muted { color: var(--color-text-secondary); font-size: var(--font-size-small); }

    .preview-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 61, 107, 0.45);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 9999;
    }

    .preview-modal.is-open { display: flex; }

    .preview-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-modal);
      padding: var(--spacing-md);
      max-width: min(960px, 92vw);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .preview-image {
      width: 100%;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      max-height: 70vh;
      object-fit: contain;
    }

    @media (max-width: 720px) {
      header { padding: var(--spacing-md); }
      main { padding: var(--spacing-md); }
      th, td { padding: 10px 8px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Run ${summary.runId}</h1>
    <p>Resumo dos passos e artefatos gerados.</p>
  </header>
  <main>
    <div class="card">
      <table>
        <thead>
          <tr><th>Passo</th><th>Status</th><th>Artefatos</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </main>

  <div class="preview-modal" id="preview-modal">
    <div class="preview-card">
      <div class="preview-header">
        <strong id="preview-title">Visualizar</strong>
        <button class="btn btn--ghost" id="preview-close" type="button">Fechar</button>
      </div>
      <img class="preview-image" id="preview-image" alt="Preview" />
    </div>
  </div>

  <script>
    const modal = document.getElementById("preview-modal");
    const image = document.getElementById("preview-image");
    const title = document.getElementById("preview-title");
    const closeBtn = document.getElementById("preview-close");

    function closePreview() {
      modal.classList.remove("is-open");
      image.src = "";
      title.textContent = "Visualizar";
    }

    document.querySelectorAll("[data-preview]").forEach((button) => {
      button.addEventListener("click", () => {
        const src = button.getAttribute("data-preview");
        const label = button.getAttribute("data-label") || "Visualizar";
        if (!src) return;
        image.src = src;
        title.textContent = label;
        modal.classList.add("is-open");
      });
    });

    closeBtn.addEventListener("click", closePreview);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closePreview();
    });
  </script>
</body>
</html>`;
}

async function loadResumeContext(resumeFrom: string, outDir: string): Promise<Context | null> {
  const summaryPath = await resolveResumeSummaryPath(resumeFrom, outDir);
  if (!summaryPath) {
    throw new Error(`Resume summary not found: ${resumeFrom}`);
  }
  const raw = await fs.readFile(summaryPath, "utf-8");
  const parsed = JSON.parse(raw) as { context?: Context };
  return normalizeContext(parsed.context);
}

async function resolveResumeSummaryPath(resumeFrom: string, outDir: string): Promise<string | null> {
  const candidates = resumeFrom.endsWith(".json")
    ? [resumeFrom, path.resolve(resumeFrom)]
    : [
        path.join(outDir, resumeFrom, "00_runSummary.json"),
        path.join(resumeFrom, "00_runSummary.json"),
        path.join(path.resolve(resumeFrom), "00_runSummary.json"),
        resumeFrom,
        path.resolve(resumeFrom)
      ];

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return candidate;
      }
      if (stat.isDirectory()) {
        const summaryPath = path.join(candidate, "00_runSummary.json");
        try {
          const summaryStat = await fs.stat(summaryPath);
          if (summaryStat.isFile()) {
            return summaryPath;
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
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

  if (step.type === "tabular") {
    const tabular = step.config?.tabular;
    if (!tabular) {
      return "";
    }
    const parts = [
      tabular.sourcePath ? `source=${path.basename(tabular.sourcePath)}` : null,
      tabular.format ? `format=${tabular.format}` : null,
      tabular.sheet !== undefined ? `sheet=${tabular.sheet}` : null
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
  if (typeof outputs.columns === "number") {
    parts.push(`columns=${outputs.columns}`);
  }
  return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
}

function renderArtifacts(outputs: Record<string, unknown>): string {
  const stepDir = typeof outputs.stepDir === "string" ? outputs.stepDir : "";
  if (!stepDir) {
    return "-";
  }
  const items: Array<{
    label: string;
    href: string;
    filename: string;
    kind: "image" | "file";
  }> = [];
  addArtifactItem(items, stepDir, outputs.screenshot, "Captura", "image");
  addArtifactItems(items, stepDir, outputs.screenshots, "Captura", "image");
  addArtifactItem(items, stepDir, outputs.query, "Consulta", "file");
  addArtifactItem(items, stepDir, outputs.result, "Resultado", "file");
  addArtifactItem(items, stepDir, outputs.evidence, "Evidencia", "file");
  addArtifactItem(items, stepDir, outputs.viewer, "Visualizador", "file");
  addArtifactItem(items, stepDir, outputs.source, "Fonte", "file");
  addArtifactItem(items, stepDir, outputs.file, "Arquivo", "file");
  addArtifactItem(items, stepDir, outputs.stdout, "Saida", "file");
  addArtifactItem(items, stepDir, outputs.stderr, "Erro", "file");
  addArtifactItem(items, stepDir, outputs.error, "Erro", "file");
  addArtifactItem(items, stepDir, outputs.errorScreenshot, "Erro (captura)", "image");

  if (items.length === 0) {
    return '<span class="muted">-</span>';
  }

  return `<div class="artifact-list">
    ${items.map((item) => renderArtifactCard(item)).join("")}
  </div>`;
}

function addArtifactItem(
  items: Array<{ label: string; href: string; filename: string; kind: "image" | "file" }>,
  stepDir: string,
  filename: unknown,
  label: string,
  kind: "image" | "file"
): void {
  if (typeof filename !== "string" || filename.length === 0) {
    return;
  }
  items.push({
    label,
    href: `${stepDir}/${filename}`,
    filename,
    kind
  });
}

function addArtifactItems(
  items: Array<{ label: string; href: string; filename: string; kind: "image" | "file" }>,
  stepDir: string,
  filenames: unknown,
  label: string,
  kind: "image" | "file"
): void {
  if (!Array.isArray(filenames)) {
    return;
  }
  filenames.forEach((name, idx) => {
    if (typeof name !== "string" || name.length === 0) {
      return;
    }
    items.push({
      label: `${label} ${idx + 1}`,
      href: `${stepDir}/${name}`,
      filename: name,
      kind
    });
  });
}

function renderArtifactCard(item: {
  label: string;
  href: string;
  filename: string;
  kind: "image" | "file";
}): string {
  const safeLabel = escapeHtml(item.label);
  const safeFilename = escapeHtml(item.filename);
  const previewButton =
    item.kind === "image"
      ? `<button class="btn btn--ghost" type="button" data-preview="${item.href}" data-label="${safeLabel}">Visualizar</button>`
      : `<a class="btn btn--ghost" href="${item.href}" target="_blank" rel="noreferrer">Abrir</a>`;
  return `<div class="artifact-card">
    <div class="artifact-title">${safeLabel}</div>
    <div class="artifact-actions">
      ${previewButton}
      <a class="btn btn--secondary" href="${item.href}" download="${safeFilename}">Baixar</a>
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

