require("dotenv").config();
const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const {
  sanitizeReportName,
  buildEvidenceCatalog,
  buildReportHtml,
  buildReportDocx
} = require("./report");

const execAsync = promisify(exec);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const triggersPath = path.join(process.cwd(), "runs", "triggers.json");
const dashboardDist = path.join(process.cwd(), "public", "dashboard");

// Track running executions
const runningExecutions = new Map();

// API endpoints
const routes = {
  "/api/plans": handleGetPlans,
  "/api/scenarios": handleGetScenarios,
  "/api/examples": handleGetExamples,
  "/api/run": handleRunPlan,
  "/api/status": handleGetStatus,
  "/api/stop": handleStopExecution,
  "/api/runs": handleRuns,
  "/api/run-details": handleRunDetails,
  "/api/reports": handleReports,
  "/api/reports/auto": handleReportAuto,
  "/api/reports/generate": handleReportGenerate,
  "/api/triggers": handleTriggers
};

let triggers = [];
let triggerObserver = null;

async function loadTriggers() {
  try {
    const raw = await fs.promises.readFile(triggersPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      triggers = parsed;
    }
  } catch (error) {
    triggers = [];
  }
}

async function saveTriggers() {
  await fs.promises.mkdir(path.dirname(triggersPath), { recursive: true });
  await fs.promises.writeFile(triggersPath, JSON.stringify(triggers, null, 2), "utf-8");
}

function createTrigger(payload) {
  const now = new Date().toISOString();
  const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const trigger = {
    id,
    name: String(payload.name || "Unnamed trigger"),
    provider: String(payload.provider || "custom"),
    target: String(payload.target || ""),
    logsUrl: String(payload.logsUrl || ""),
    status: "idle",
    createdAt: now,
    updatedAt: now,
    lastMessage: ""
  };
  triggers.unshift(trigger);
  return trigger;
}

function updateTrigger(payload) {
  const target = triggers.find((item) => item.id === payload.id);
  if (!target) {
    return null;
  }
  const now = new Date().toISOString();
  if (payload.status) target.status = payload.status;
  if (payload.logsUrl !== undefined) target.logsUrl = String(payload.logsUrl || "");
  if (payload.lastMessage !== undefined) target.lastMessage = String(payload.lastMessage || "");
  if (payload.name !== undefined) target.name = String(payload.name || target.name);
  if (payload.provider !== undefined) target.provider = String(payload.provider || target.provider);
  if (payload.target !== undefined) target.target = String(payload.target || target.target);
  target.updatedAt = now;
  return target;
}

function deleteTrigger(id) {
  const index = triggers.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }
  triggers.splice(index, 1);
  return true;
}

function startTriggerObserver() {
  if (triggerObserver) {
    return;
  }
  triggerObserver = setInterval(async () => {
    let changed = false;
    const now = new Date().toISOString();
    for (const trigger of triggers) {
      if (trigger.status !== "observing") {
        continue;
      }
      trigger.updatedAt = now;
      trigger.lastMessage = `observing @ ${now}`;
      changed = true;
    }
    if (changed) {
      await saveTriggers();
    }
  }, 2500);
}

async function handleGetPlans(req, res) {
  try {
    const plansDir = path.join(process.cwd(), "examples");
    const plans = await findPlans(plansDir, "examples");
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ plans }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleGetScenarios(req, res) {
  try {
    const plansDir = path.join(process.cwd(), "scenarios");
    const plans = await findPlans(plansDir, "scenarios");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ plans }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleGetExamples(req, res) {
  try {
    const plansDir = path.join(process.cwd(), "examples");
    const plans = await findPlans(plansDir, "examples");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ plans }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function findPlans(dir, baseRoot, basePath = "") {
  const plans = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      const subPlans = await findPlans(fullPath, baseRoot, relativePath);
      plans.push(...subPlans);
    } else if (entry.name === "plan.json") {
      try {
        const content = await fs.promises.readFile(fullPath, "utf-8");
        const plan = JSON.parse(content);
        const planDir = path.dirname(fullPath);
        const behaviors = await loadBehaviorsSafe(plan.behaviorsPath, planDir);
        const curl = await loadCurlSafe(plan.curlPath, planDir);
        const steps = Array.isArray(plan.steps)
          ? plan.steps.map((step, index) =>
              buildStepDetails(step, index, behaviors, curl)
            )
          : [];

        plans.push({
          path: path.join(baseRoot, relativePath).replace(/\\/g, "/"),
          fullPath: fullPath,
          feature: plan.metadata?.feature || "Unnamed",
          ticket: plan.metadata?.ticket || "",
          env: plan.metadata?.env || "",
          stepsCount: plan.steps?.length || 0,
          steps,
          config: summarizePlanConfig(plan),
          inputs: plan.inputs ?? null
        });
      } catch (error) {
        // Skip invalid plan files
      }
    }
  }
  
  return plans;
}

function summarizePlanConfig(plan) {
  const defaultsCount =
    plan.inputs?.defaults && typeof plan.inputs.defaults === "object"
      ? Object.keys(plan.inputs.defaults).length
      : 0;
  const overridesCount =
    plan.inputs?.overrides && typeof plan.inputs.overrides === "object"
      ? Object.keys(plan.inputs.overrides).length
      : 0;
  const itemsCount = Array.isArray(plan.inputs?.items) ? plan.inputs.items.length : 0;
  return {
    failPolicy: plan.failPolicy ?? "stop",
    cacheEnabled: Boolean(plan.cache?.enabled),
    cacheDir: plan.cache?.dir ?? "",
    envPrefix: plan.inputs?.envPrefix ?? "",
    defaultsCount,
    overridesCount,
    itemsCount,
    reuseSession: Boolean(plan.browser?.reuseSession),
    headless: plan.browser?.headless ?? null,
    channel: plan.browser?.channel ?? "",
    behaviorsPath: plan.behaviorsPath ?? "",
    curlPath: plan.curlPath ?? ""
  };
}

async function loadBehaviorsSafe(behaviorsPath, planDir) {
  if (!behaviorsPath || typeof behaviorsPath !== "string") {
    return null;
  }
  try {
    const resolved = resolveAssetPath(behaviorsPath, planDir);
    const raw = await fs.promises.readFile(resolved, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.behaviors) {
      return parsed.behaviors;
    }
  } catch (error) {
    return null;
  }
  return null;
}

async function loadCurlSafe(curlPath, planDir) {
  if (!curlPath || typeof curlPath !== "string") {
    return null;
  }
  try {
    const resolved = resolveAssetPath(curlPath, planDir);
    const raw = await fs.promises.readFile(resolved, "utf-8");
    return parseCurl(raw);
  } catch (error) {
    return null;
  }
}

function resolveAssetPath(assetPath, planDir) {
  if (path.isAbsolute(assetPath)) {
    return assetPath;
  }
  const fromCwd = path.resolve(process.cwd(), assetPath);
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }
  return path.resolve(planDir, assetPath);
}

function parseCurl(raw) {
  const normalized = raw.replace(/\\\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
  const methodMatch = normalized.match(/--request\s+(\w+)/i) || normalized.match(/-X\s+(\w+)/i);
  const urlMatch =
    normalized.match(/--url\s+(\S+)/) ||
    normalized.match(/curl\s+['"]([^'"]+)['"]/) ||
    normalized.match(/curl\s+(\S+)/);
  return {
    method: methodMatch ? methodMatch[1].toUpperCase() : "GET",
    url: urlMatch ? urlMatch[1] : ""
  };
}

function buildStepDetails(step, index, behaviors, curl) {
  const id = step.id || `step-${index + 1}`;
  const type = step.type || "unknown";
  const details = buildStepDetailData(step, behaviors, curl);
  const description =
    step.description && step.description.trim().length > 0
      ? step.description.trim()
      : buildDefaultDescription(type, details);
  return {
    index: index + 1,
    id,
    type,
    description,
    details,
    artifacts: defaultArtifactsForType(type),
    raw: sanitizeStepRaw(step)
  };
}

function sanitizeStepRaw(step) {
  if (!step || typeof step !== "object") {
    return null;
  }
  return {
    id: step.id ?? null,
    type: step.type ?? null,
    description: step.description ?? null,
    behaviorId: step.behaviorId ?? null,
    requires: step.requires ?? null,
    exports: step.exports ?? null,
    cache: step.cache ?? null,
    loop: step.loop ?? null,
    config: step.config ?? null
  };
}

function buildStepDetailData(step, behaviors, curl) {
  if (!step || typeof step !== "object") {
    return null;
  }

  if (step.type === "browser") {
    const behavior = step.behaviorId && behaviors ? behaviors[step.behaviorId] : null;
    const actions = behavior && Array.isArray(behavior.actions) ? behavior.actions : [];
    return {
      behaviorId: step.behaviorId || "",
      actions: actions.slice(0, 6).map((action) => buildActionSummary(action)),
      actionsCount: actions.length
    };
  }

  if (step.type === "api") {
    return {
      method: curl ? curl.method : "",
      url: curl ? curl.url : ""
    };
  }

  if (step.type === "sqlEvidence") {
    const sql = step.config && step.config.sql ? step.config.sql : {};
    return {
      adapter: sql.adapter || "",
      queryPath: sql.queryPath || "",
      query: sql.query || "",
      expectRows: sql.expectRows
    };
  }

  if (step.type === "cli") {
    const cli = step.config && step.config.cli ? step.config.cli : {};
    return {
      command: cli.command || "",
      args: Array.isArray(cli.args) ? cli.args : [],
      cwd: cli.cwd || ""
    };
  }

  if (step.type === "specialist") {
    const specialist = step.config && step.config.specialist ? step.config.specialist : {};
    return {
      task: specialist.task || "",
      outputPath: specialist.outputPath || ""
    };
  }

  if (step.type === "logstream") {
    const logstream = step.config && step.config.logstream ? step.config.logstream : {};
    return {
      url: logstream.url || "",
      title: logstream.title || ""
    };
  }

  if (step.type === "tabular") {
    const tabular = step.config && step.config.tabular ? step.config.tabular : {};
    return {
      sourcePath: tabular.sourcePath || "",
      format: tabular.format || "",
      sheet: tabular.sheet ?? null,
      maxRows: tabular.maxRows ?? null
    };
  }

  return null;
}

function buildActionSummary(action) {
  if (!action || typeof action !== "object") {
    return { type: "unknown" };
  }
  const summary = { type: action.type };
  if (action.type === "goto") {
    summary.url = action.url;
  }
  if (action.selector) {
    summary.selector = action.selector;
  }
  if (action.text) {
    summary.text = action.text;
  }
  return summary;
}

function buildDefaultDescription(type, details) {
  if (type === "browser") {
    const behaviorId = details && details.behaviorId ? `behavior ${details.behaviorId}` : "";
    const actionsCount =
      details && Number.isFinite(details.actionsCount) ? `${details.actionsCount} actions` : "";
    const suffix = [behaviorId, actionsCount].filter(Boolean).join(", ");
    return suffix ? `Browser (${suffix})` : "Browser actions";
  }
  if (type === "api") {
    if (details && details.method && details.url) {
      return `API ${details.method} ${details.url}`;
    }
    return "API request";
  }
  if (type === "sqlEvidence") {
    const adapter = details && details.adapter ? details.adapter : "";
    const source = details && details.queryPath
      ? details.queryPath
      : details && details.query
      ? "inline query"
      : "";
    const expectRows =
      details && details.expectRows !== undefined ? `expect ${details.expectRows}` : "";
    const suffix = [adapter, source, expectRows].filter(Boolean).join(" | ");
    if (details && details.queryPath) {
      return suffix ? `SQL ${suffix}` : `SQL from ${details.queryPath}`;
    }
    if (details && details.query) {
      return suffix ? `SQL ${suffix}` : "SQL query";
    }
    return suffix ? `SQL ${suffix}` : "SQL evidence";
  }
  if (type === "cli") {
    if (details && details.command) {
      const args =
        details.args && Array.isArray(details.args) && details.args.length > 0
          ? ` ${details.args.join(" ")}`
          : "";
      return `CLI ${details.command}${args}`;
    }
    return "CLI command";
  }
  if (type === "specialist") {
    const task = details && details.task ? details.task : "";
    const outputPath = details && details.outputPath ? details.outputPath : "";
    const suffix = [task, outputPath].filter(Boolean).join(" ");
    return suffix ? `Specialist ${suffix}` : "Specialist task";
  }
  if (type === "tabular") {
    const source = details && details.sourcePath ? details.sourcePath : "";
    const format = details && details.format ? details.format : "";
    const sheet = details && details.sheet !== null && details.sheet !== undefined
      ? `sheet ${details.sheet}`
      : "";
    const suffix = [source, format, sheet].filter(Boolean).join(" | ");
    return suffix ? `Tabular ${suffix}` : "Tabular evidence";
  }
  return "Step";
}

function defaultArtifactsForType(type) {
  if (type === "api") {
    return ["evidence.html"];
  }
  if (type === "sqlEvidence") {
    return ["query.sql", "result.csv", "evidence.html"];
  }
  if (type === "browser") {
    return ["screenshot.png"];
  }
  if (type === "cli") {
    return ["stdout.txt", "stderr.txt", "metadata.json", "evidence.html"];
  }
  if (type === "specialist") {
    return ["file.txt"];
  }
  if (type === "logstream") {
    return ["evidence.html"];
  }
  if (type === "tabular") {
    return ["viewer.html", "screenshot.png"];
  }
  return [];
}

async function handleRunPlan(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", async () => {
    try {
      const { planPath, fromStep, toStep, selectedSteps, inputs } = JSON.parse(body);
      
      if (!planPath) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "planPath is required" }));
        return;
      }
      
      const resolvedPlanPath = resolvePlanPath(planPath);
      const runSelection = await resolveRunSelection(
        resolvedPlanPath,
        fromStep,
        toStep,
        selectedSteps
      );
      const range = runSelection.range;
      const steps = runSelection.selectedSteps;
      const executionId = Date.now().toString();
      const planPathForRun = await resolvePlanForRun(resolvedPlanPath, inputs);
      const safePlanPath = planPathForRun.replace(/"/g, '\\"');
      const planSourceFlag = planPath ? ` --plan-source "${planPath.replace(/"/g, '\\"')}"` : "";
      const rangeFlags = buildRangeFlags(range);
      const stepsFlags = buildStepsFlags(steps);
      const command = `npm start -- --plan "${safePlanPath}" --out runs${rangeFlags}${stepsFlags}${planSourceFlag}`;
      
        // Execute in background
        const child = exec(command, { cwd: process.cwd() });

        runningExecutions.set(executionId, {
          planPath,
          status: "running",
          startedAt: new Date().toISOString(),
          output: [],
          fromStep: range?.fromStep,
          toStep: range?.toStep,
          selectedSteps: steps ?? null,
          child
        });
      
      child.stdout.on("data", (data) => {
        const execution = runningExecutions.get(executionId);
        if (!execution) {
          return;
        }
        const text = data.toString();
        execution.output.push(text);
        if (text.includes("Run ") && text.includes(" finished:")) {
          execution.status = "completed";
          execution.finishedAt = new Date().toISOString();
        }
      });
      
      child.stderr.on("data", (data) => {
        const execution = runningExecutions.get(executionId);
        if (!execution) {
          return;
        }
        execution.output.push(`ERROR: ${data.toString()}`);
      });
      
      const finalizeExecution = (status, details = {}) => {
        const execution = runningExecutions.get(executionId);
        if (!execution || execution.status !== "running") {
          return;
        }
        execution.status = status;
        execution.finishedAt = new Date().toISOString();
        Object.assign(execution, details);
      };

      child.on("exit", (code, signal) => {
        finalizeExecution(code === 0 ? "completed" : "failed", {
          exitCode: code,
          signal
        });
        exec("npm run index", { cwd: process.cwd() });
      });

      child.on("close", (code, signal) => {
        finalizeExecution(code === 0 ? "completed" : "failed", {
          exitCode: code,
          signal
        });
      });

      child.on("error", (error) => {
        finalizeExecution("failed", { error: error.message });
      });
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        executionId,
        message: "Execution started",
        planPath,
        fromStep: range?.fromStep,
        toStep: range?.toStep,
        selectedSteps: steps ?? null
      }));
      
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

async function handleStopExecution(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const executionId = url.searchParams.get("id");
    if (!executionId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "executionId is required" }));
      return;
    }
    const execution = runningExecutions.get(executionId);
    if (!execution) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Execution not found" }));
      return;
    }
    if (execution.status !== "running") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, status: execution.status }));
      return;
    }
    const child = execution.child;
    if (child) {
      child.kill("SIGTERM");
    }
    execution.status = "stopped";
    execution.finishedAt = new Date().toISOString();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: execution.status }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function resolveRunSelection(
  resolvedPlanPath,
  fromStepInput,
  toStepInput,
  selectedStepsInput
) {
  const raw = await fs.promises.readFile(resolvedPlanPath, "utf-8");
  const plan = JSON.parse(raw);
  const stepsCount = Array.isArray(plan.steps) ? plan.steps.length : 0;
  if (stepsCount === 0) {
    throw new Error("plan has no steps to run");
  }
  const range = validateRunRange(stepsCount, fromStepInput, toStepInput);
  const selectedSteps = normalizeSelectedSteps(stepsCount, selectedStepsInput);
  return { range, selectedSteps };
}

function validateRunRange(stepsCount, fromStepInput, toStepInput) {
  if (fromStepInput === undefined && toStepInput === undefined) {
    return null;
  }
  const fromStep = parseRangeValue(fromStepInput);
  const toStep = parseRangeValue(toStepInput);
  const normalized = {
    fromStep: fromStep ?? 1,
    toStep: toStep ?? stepsCount
  };

  if (
    normalized.fromStep < 1 ||
    normalized.toStep < 1 ||
    normalized.fromStep > stepsCount ||
    normalized.toStep > stepsCount
  ) {
    throw new Error(`Invalid range: fromStep=${normalized.fromStep} toStep=${normalized.toStep}`);
  }
  if (normalized.fromStep > normalized.toStep) {
    throw new Error(`Invalid range: fromStep=${normalized.fromStep} is greater than toStep=${normalized.toStep}`);
  }
  return normalized;
}

function parseRangeValue(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildRangeFlags(range) {
  if (!range) {
    return "";
  }
  const parts = [];
  if (range.fromStep) {
    parts.push(`--from ${range.fromStep}`);
  }
  if (range.toStep) {
    parts.push(`--to ${range.toStep}`);
  }
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

function normalizeSelectedSteps(stepsCount, selectedStepsInput) {
  if (!Array.isArray(selectedStepsInput)) {
    return null;
  }
  if (selectedStepsInput.length === 0) {
    throw new Error("selectedSteps is empty");
  }
  const parsed = selectedStepsInput
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value));
  const invalid = parsed.filter((value) => value < 1 || value > stepsCount);
  if (invalid.length > 0) {
    throw new Error(`selectedSteps out of range: ${invalid.join(",")}`);
  }
  const unique = Array.from(new Set(parsed)).sort((a, b) => a - b);
  if (unique.length === 0) {
    throw new Error("selectedSteps is empty");
  }
  return unique;
}

function buildStepsFlags(steps) {
  if (!steps || steps.length === 0) {
    return "";
  }
  return ` --steps ${steps.join(",")}`;
}

async function resolvePlanForRun(resolvedPlanPath, inputs) {
  if (!inputs || typeof inputs !== "object") {
    return resolvedPlanPath;
  }
  const raw = await fs.promises.readFile(resolvedPlanPath, "utf-8");
  const plan = JSON.parse(raw);
  const merged = applyInputsOverrides(plan, inputs);
  const tmpDir = path.join(process.cwd(), "runs", "tmp-plans");
  await fs.promises.mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(
    tmpDir,
    `plan-${Date.now()}-${Math.floor(Math.random() * 10000)}.json`
  );
  await fs.promises.writeFile(tmpPath, JSON.stringify(merged, null, 2), "utf-8");
  return tmpPath;
}

function applyInputsOverrides(plan, inputs) {
  const updated = { ...plan, inputs: { ...(plan.inputs ?? {}) } };
  if (inputs.defaults && typeof inputs.defaults === "object") {
    updated.inputs.defaults = { ...(updated.inputs.defaults ?? {}), ...inputs.defaults };
  }
  if (inputs.overrides && typeof inputs.overrides === "object") {
    updated.inputs.overrides = { ...(updated.inputs.overrides ?? {}), ...inputs.overrides };
  }
  if (typeof inputs.envPrefix === "string") {
    updated.inputs.envPrefix = inputs.envPrefix;
  }
  if (Array.isArray(inputs.items)) {
    updated.inputs.items = inputs.items;
  }
  return updated;
}

function resolvePlanPath(planPath) {
  const normalized = planPath.replace(/\\/g, "/");
  const roots = ["scenarios", "examples"];
  const root = roots.find((name) => normalized.startsWith(`${name}/`));
  if (!root) {
    throw new Error("planPath must start with scenarios/ or examples/");
  }
  const baseDir = path.join(process.cwd(), root);
  const relative = normalized.slice(`${root}/`.length);
  const resolved = path.resolve(baseDir, relative);

  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    throw new Error(`planPath must stay within ${root}/`);
  }

  return resolved;
}

async function handleGetStatus(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const executionId = url.searchParams.get("id");
  
  if (!executionId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "executionId is required" }));
    return;
  }
  
  const execution = runningExecutions.get(executionId);
  
  if (!execution) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Execution not found" }));
    return;
  }
  
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(execution));
}

async function handleRuns(req, res) {
  try {
    if (req.method === "DELETE") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const runId = url.searchParams.get("runId");
      if (!runId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "runId is required" }));
        return;
      }
      if (runId.includes("/") || runId.includes("\\")) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid runId" }));
        return;
      }
      const runDir = path.join(process.cwd(), "runs", runId);
      if (!fs.existsSync(runDir)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "run not found" }));
        return;
      }
      await fs.promises.rm(runDir, { recursive: true, force: true });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    const runsDir = path.join(process.cwd(), "runs");
    if (!fs.existsSync(runsDir)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ runs: [], page: 1, pageSize: 5, total: 0 }));
      return;
    }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.max(
      1,
      Math.min(20, Number.parseInt(url.searchParams.get("pageSize") ?? "5", 10) || 5)
    );
    const entries = await fs.promises.readdir(runsDir, { withFileTypes: true });
    const runIds = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter((name) => name !== "tmp-plans")
      .sort((a, b) => b.localeCompare(a));
    const total = runIds.length;
    const start = (page - 1) * pageSize;
    const pageIds = runIds.slice(start, start + pageSize);
    const runs = await Promise.all(
      pageIds.map(async (runId) => {
        const summaryPath = path.join(runsDir, runId, "00_runSummary.json");
        try {
          const summaryRaw = await fs.promises.readFile(summaryPath, "utf-8");
          const summary = JSON.parse(summaryRaw);
          const counts = { OK: 0, FAIL: 0, SKIPPED: 0 };
          let cacheHits = 0;
          for (const step of summary.steps ?? []) {
            if (step.status === "OK") counts.OK += 1;
            if (step.status === "FAIL") counts.FAIL += 1;
            if (step.status === "SKIPPED") counts.SKIPPED += 1;
            if (step.notes === "cache hit" || step.outputs?.cacheHit) {
              cacheHits += 1;
            }
          }
          const status =
            counts.FAIL > 0 ? "FAIL" : counts.SKIPPED > 0 ? "SKIPPED" : "OK";
          return {
            runId,
            planPath: summary.planPath ?? null,
            fromStep: summary.fromStep ?? null,
            toStep: summary.toStep ?? null,
            selectedSteps: summary.selectedSteps ?? null,
            feature: summary.feature ?? "",
            ticket: summary.ticket ?? "",
            env: summary.env ?? "",
            startedAt: summary.startedAt ?? "",
            finishedAt: summary.finishedAt ?? "",
            status,
            counts,
            steps: summary.steps?.length ?? 0,
            cacheHits
          };
        } catch (error) {
          return { runId };
        }
      })
    );
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ runs, page, pageSize, total }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleRunDetails(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const runId = url.searchParams.get("runId");
    if (!runId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "runId is required" }));
      return;
    }
    const runDir = path.join(process.cwd(), "runs", runId);
    const summaryPath = path.join(runDir, "00_runSummary.json");
    if (!fs.existsSync(summaryPath)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "run not found" }));
      return;
    }
    const raw = await fs.promises.readFile(summaryPath, "utf-8");
    const summary = JSON.parse(raw);
    const catalog = buildEvidenceCatalog(summary, runId);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ runId, summary, steps: catalog.steps }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleReports(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET") {
      const runId = url.searchParams.get("runId");
      if (!runId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "runId is required" }));
        return;
      }
      const reportsDir = path.join(process.cwd(), "runs", runId, "reports");
      if (!fs.existsSync(reportsDir)) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reports: [] }));
        return;
      }
      const entries = await fs.promises.readdir(reportsDir);
      const reports = entries
        .filter((name) => name.endsWith(".json"))
        .map((name) => {
          const base = name.replace(/\.json$/, "");
          return {
            name: base,
            jsonUrl: `/runs/${runId}/reports/${base}.json`,
            htmlUrl: `/runs/${runId}/reports/${base}.html`,
            docxUrl: `/runs/${runId}/reports/${base}.docx`
          };
        });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ reports }));
      return;
    }
    if (req.method === "POST") {
      const payload = await readJsonBody(req);
      if (!payload?.runId || !payload?.report) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "runId and report are required" }));
        return;
      }
      const safeName = sanitizeReportName(payload.name || payload.report?.name);
      const reportsDir = path.join(process.cwd(), "runs", payload.runId, "reports");
      await fs.promises.mkdir(reportsDir, { recursive: true });
      const jsonPath = path.join(reportsDir, `${safeName}.json`);
      await fs.promises.writeFile(jsonPath, JSON.stringify(payload.report, null, 2), "utf-8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        name: safeName,
        jsonUrl: `/runs/${payload.runId}/reports/${safeName}.json`
      }));
      return;
    }
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleReportGenerate(req, res) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    const payload = await readJsonBody(req);
    if (!payload?.report) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "report is required" }));
      return;
    }
    const blocks = Array.isArray(payload.report?.blocks) ? payload.report.blocks : [];
    const baseRunId =
      String(payload.runId || payload.report?.runId || "") ||
      String(blocks.find((block) => block?.runId)?.runId || "");
    if (!baseRunId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "runId is required (or set runId on evidence blocks)" }));
      return;
    }
    const runId = baseRunId;
    const runDir = path.join(process.cwd(), "runs", runId);
    const summaryPath = path.join(runDir, "00_runSummary.json");
    let summary = { steps: [] };
    if (fs.existsSync(summaryPath)) {
      const raw = await fs.promises.readFile(summaryPath, "utf-8");
      summary = JSON.parse(raw);
    } else {
      const missingStepDir = blocks.find(
        (block) => block?.type === "evidence" && (!block.runId || !block.stepDir)
      );
      if (missingStepDir) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "run not found" }));
        return;
      }
    }
    const reportBlocks = Array.isArray(payload.report?.blocks) ? payload.report.blocks : [];
    const extraRunIds = Array.from(
      new Set(
        reportBlocks
          .map((block) => String(block.runId || ""))
          .filter((value) => value && value !== runId)
      )
    );
    if (extraRunIds.length > 0) {
      summary.byRun = {};
      for (const extraRunId of extraRunIds) {
        try {
          const extraSummaryPath = path.join(process.cwd(), "runs", extraRunId, "00_runSummary.json");
          const extraRaw = await fs.promises.readFile(extraSummaryPath, "utf-8");
          summary.byRun[extraRunId] = JSON.parse(extraRaw);
        } catch (error) {
          summary.byRun[extraRunId] = null;
        }
      }
    }
    const safeName = sanitizeReportName(payload.name || payload.report?.name);
    const reportsDir = path.join(runDir, "reports");
    await fs.promises.mkdir(reportsDir, { recursive: true });
    const jsonPath = path.join(reportsDir, `${safeName}.json`);
    await fs.promises.writeFile(jsonPath, JSON.stringify(payload.report, null, 2), "utf-8");
    const html = buildReportHtml(payload.report, summary, runId);
    const htmlPath = path.join(reportsDir, `${safeName}.html`);
    await fs.promises.writeFile(htmlPath, html, "utf-8");
    const docx = buildReportDocx(payload.report, summary, runId);
    const docxPath = path.join(reportsDir, `${safeName}.docx`);
    await fs.promises.writeFile(docxPath, docx);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: safeName,
      jsonUrl: `/runs/${runId}/reports/${safeName}.json`,
      htmlUrl: `/runs/${runId}/reports/${safeName}.html`,
      docxUrl: `/runs/${runId}/reports/${safeName}.docx`
    }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleReportAuto(req, res) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    const payload = await readJsonBody(req);
    if (!payload?.runId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "runId is required" }));
      return;
    }
    const runId = String(payload.runId);
    const runDir = path.join(process.cwd(), "runs", runId);
    const summaryPath = path.join(runDir, "00_runSummary.json");
    if (!fs.existsSync(summaryPath)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "run not found" }));
      return;
    }
    const raw = await fs.promises.readFile(summaryPath, "utf-8");
    const summary = JSON.parse(raw);
    const report = buildAutoReportFromSummary(summary, runId);
    const safeName = sanitizeReportName(payload.name || report.name);
    const reportsDir = path.join(runDir, "reports");
    await fs.promises.mkdir(reportsDir, { recursive: true });
    const jsonPath = path.join(reportsDir, `${safeName}.json`);
    await fs.promises.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf-8");
    const html = buildReportHtml(report, summary, runId);
    const htmlPath = path.join(reportsDir, `${safeName}.html`);
    await fs.promises.writeFile(htmlPath, html, "utf-8");
    const docx = buildReportDocx(report, summary, runId);
    const docxPath = path.join(reportsDir, `${safeName}.docx`);
    await fs.promises.writeFile(docxPath, docx);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: safeName,
      jsonUrl: `/runs/${runId}/reports/${safeName}.json`,
      htmlUrl: `/runs/${runId}/reports/${safeName}.html`,
      docxUrl: `/runs/${runId}/reports/${safeName}.docx`
    }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

function buildAutoReportFromSummary(summary, runId) {
  const blocks = [];
  const feature = summary.feature || "";
  blocks.push({
    id: "auto-title",
    type: "h1",
    text: feature ? `Relatorio - ${feature}` : `Relatorio ${runId}`,
    enabled: true
  });
  blocks.push({
    id: "auto-meta",
    type: "small",
    text: `Run ${runId} gerado em ${summary.finishedAt || summary.startedAt || ""}`.trim(),
    enabled: true
  });
  const steps = Array.isArray(summary.steps) ? summary.steps : [];
  steps.forEach((step) => {
    blocks.push({
      id: `auto-${step.id}-title`,
      type: "h2",
      text: `${step.id} (${step.type})`,
      enabled: true
    });
    const outputs = step.outputs || {};
    const stepDir = outputs.stepDir;
    const artifacts = [];
    if (outputs.evidence) {
      artifacts.push({ label: "evidence", filename: outputs.evidence });
    }
    if (outputs.viewer) {
      artifacts.push({ label: "viewer", filename: outputs.viewer });
    }
    if (outputs.screenshot) {
      artifacts.push({ label: "screenshot", filename: outputs.screenshot });
    }
    if (Array.isArray(outputs.screenshots)) {
      outputs.screenshots.forEach((name) => artifacts.push({ label: "screenshot", filename: name }));
    }
    artifacts.forEach((artifact, index) => {
      if (!stepDir) {
        return;
      }
      blocks.push({
        id: `auto-${step.id}-ev-${index}`,
        type: "evidence",
        label: `${step.id} ${artifact.label}`,
        runId,
        stepId: step.id,
        filename: artifact.filename,
        stepDir,
        enabled: true
      });
    });
  });
  return {
    name: `auto-${runId}`,
    runId,
    blocks
  };
}

async function handleTriggers(req, res) {
  try {
    if (triggers.length === 0) {
      await loadTriggers();
    }
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ triggers }));
      return;
    }
    if (req.method === "POST") {
      const payload = await readJsonBody(req);
      if (!payload?.name) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "name is required" }));
        return;
      }
      const trigger = createTrigger(payload);
      await saveTriggers();
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ trigger }));
      return;
    }
    if (req.method === "PATCH") {
      const payload = await readJsonBody(req);
      if (!payload?.id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "id is required" }));
        return;
      }
      const updated = updateTrigger(payload);
      if (!updated) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "trigger not found" }));
        return;
      }
      await saveTriggers();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ trigger: updated }));
      return;
    }
    if (req.method === "DELETE") {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const id = url.searchParams.get("id");
      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "id is required" }));
        return;
      }
      const removed = deleteTrigger(id);
      if (!removed) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "trigger not found" }));
        return;
      }
      await saveTriggers();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        resolve(parsed);
      } catch (error) {
        resolve({});
      }
    });
  });
}

// Main server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API routes
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const handler = routes[pathname];
  if (handler) {
    handler(req, res);
    return;
  }
  
  // Static files
  serveStatic(req, res);
});

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  
  if (urlPath.includes("..")) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }
  
  if (urlPath === "/") {
    urlPath = "/index.html";
  }

  if (urlPath === "/runs/index.html") {
    const runsIndexPath = path.join(process.cwd(), "index.html");
    if (fs.existsSync(runsIndexPath)) {
      return streamFile(res, runsIndexPath);
    }
  }
  
  const candidatePaths = [];
  const cleanPath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
  if (urlPath === "/index.html") {
    candidatePaths.push(path.join(dashboardDist, "index.html"));
  } else {
    candidatePaths.push(path.join(dashboardDist, cleanPath));
  }
  candidatePaths.push(path.join(process.cwd(), cleanPath));

  const filePath = candidatePaths.find((candidate) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch (error) {
      return false;
    }
  });

  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
    return;
  }

  streamFile(res, filePath);
}

function streamFile(res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml"
    };

    const mimeType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mimeType,
      "Content-Length": stats.size
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on("error", (streamErr) => {
      console.error("Stream error:", streamErr);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
      }
      res.end("500 Internal Server Error");
    });
  });
}

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Automation Dashboard Started!`);
  console.log(`\n📂 Serving from: ${process.cwd()}`);
  console.log(`🌐 Dashboard: http://${HOST}:${PORT}`);
  console.log(`📊 Runs index: http://${HOST}:${PORT}/runs/index.html`);
  console.log(`\n💡 Features:`);
  console.log(`   - Browse and run test plans`);
  console.log(`   - Monitor execution status`);
  console.log(`   - View results in real-time`);
  console.log(`\n⌨️  Press Ctrl+C to stop\n`);
});

setImmediate(() => {
  loadTriggers().finally(() => startTriggerObserver());
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`   Try: PORT=3001 npm run dashboard\n`);
  } else {
    console.error("\n❌ Server error:", err, "\n");
  }
  process.exit(1);
});
