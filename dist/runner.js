"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executePlan = executePlan;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const behaviors_1 = require("./behaviors");
const browser_1 = require("./browser");
const cloudwatch_1 = require("./cloudwatch");
const context_1 = require("./context");
const errors_1 = require("./errors");
const exports_1 = require("./exports");
const openapi_1 = require("./openapi");
const sql_1 = require("./sql");
const swagger_1 = require("./swagger");
const utils_1 = require("./utils");
async function executePlan(plan, outDir) {
    const runId = (0, utils_1.createRunId)();
    const runDir = path_1.default.resolve(outDir, runId);
    const stepsDir = path_1.default.join(runDir, "steps");
    const behaviors = plan.behaviorsPath ? await (0, behaviors_1.loadBehaviors)(plan.behaviorsPath) : null;
    const openapi = plan.openapiPath ? await (0, openapi_1.loadOpenApi)(plan.openapiPath) : null;
    const runStartedAt = (0, utils_1.nowIso)();
    const totalSteps = plan.steps.length;
    const context = {
        feature: plan.metadata.feature,
        ticket: plan.metadata.ticket ?? "",
        env: plan.metadata.env ?? "",
        runId,
        startedAt: runStartedAt
    };
    logRunStart(runId, plan, outDir, totalSteps);
    await fs_1.promises.mkdir(stepsDir, { recursive: true });
    const results = [];
    for (let i = 0; i < plan.steps.length; i += 1) {
        const step = plan.steps[i];
        const stepIndex = String(i + 1).padStart(2, "0");
        const stepDirName = `${stepIndex}_${step.id ?? step.type}`;
        const stepDir = path_1.default.join(stepsDir, stepDirName);
        await fs_1.promises.mkdir(stepDir, { recursive: true });
        const stepStartedAt = (0, utils_1.nowIso)();
        let status = "SKIPPED";
        const outputs = {};
        outputs.stepDir = `steps/${stepDirName}`;
        let notes = "Bootstrap: step execution not implemented yet";
        const errorPath = path_1.default.join(stepDir, "error.json");
        const errorPngPath = path_1.default.join(stepDir, "error.png");
        let resolvedStep = step;
        try {
            logStepStart(i + 1, totalSteps, step);
            ensureRequires(step, context);
            resolvedStep = (0, context_1.resolveTemplatesDeep)(step, context);
            if (resolvedStep.type === "browser") {
                const actions = getBehaviorActions(resolvedStep.behaviorId, behaviors, context);
                const browserResult = await (0, browser_1.executeBrowserStep)(actions, stepDir);
                status = "OK";
                outputs.screenshot = path_1.default.basename(browserResult.screenshotPath);
                notes = undefined;
            }
            else if (resolvedStep.type === "swagger") {
                const actions = getBehaviorActions(resolvedStep.behaviorId, behaviors, context);
                const swaggerResult = await (0, swagger_1.executeSwaggerStep)(resolvedStep, actions, openapi, stepDir);
                status = "OK";
                outputs.screenshot = path_1.default.basename(swaggerResult.screenshotPath);
                if (swaggerResult.responseText) {
                    outputs.responseText = swaggerResult.responseText;
                }
                (0, exports_1.applyExports)(context, resolvedStep.exports, { responseText: swaggerResult.responseText });
                notes = undefined;
            }
            else if (resolvedStep.type === "cloudwatch") {
                const actions = getBehaviorActions(resolvedStep.behaviorId, behaviors, context);
                const cloudwatchResult = await (0, cloudwatch_1.executeCloudwatchStep)(resolvedStep, actions, stepDir);
                status = "OK";
                outputs.screenshot = path_1.default.basename(cloudwatchResult.screenshotPath);
                outputs.attempts = cloudwatchResult.attempts;
                notes = undefined;
            }
            else if (resolvedStep.type === "sqlEvidence") {
                const sqlResult = await (0, sql_1.executeSqlEvidenceStep)(resolvedStep, stepDir);
                status = "OK";
                outputs.screenshot = path_1.default.basename(sqlResult.screenshotPath);
                outputs.query = sqlResult.queryFile;
                outputs.result = sqlResult.resultFile;
                outputs.evidence = sqlResult.evidenceFile;
                outputs.rows = sqlResult.rows;
                (0, exports_1.applyExports)(context, resolvedStep.exports, {
                    sqlRows: sqlResult.rowsData
                });
                notes = undefined;
            }
            logStepSuccess(i + 1, totalSteps, resolvedStep, outputs);
        }
        catch (error) {
            status = "FAIL";
            notes = error instanceof Error ? error.message : String(error);
            logStepFailure(i + 1, totalSteps, step, notes);
            await (0, errors_1.writeErrorFile)(errorPath, error);
            await (0, errors_1.writeErrorPng)(errorPngPath);
            if ((plan.failPolicy ?? "stop") === "stop") {
                logStopOnFailure();
                await finalizeStep(stepDir, step, resolvedStep, status, stepStartedAt, outputs, notes);
                results.push({
                    id: resolvedStep.id ?? resolvedStep.type,
                    type: resolvedStep.type,
                    status,
                    startedAt: stepStartedAt,
                    finishedAt: (0, utils_1.nowIso)(),
                    inputs: resolvedStep,
                    outputs,
                    notes
                });
                break;
            }
        }
        const result = {
            id: resolvedStep.id ?? resolvedStep.type,
            type: resolvedStep.type,
            status,
            startedAt: stepStartedAt,
            finishedAt: (0, utils_1.nowIso)(),
            inputs: resolvedStep,
            outputs,
            notes
        };
        await fs_1.promises.writeFile(path_1.default.join(stepDir, "metadata.json"), JSON.stringify(result, null, 2), "utf-8");
        results.push(result);
    }
    const runSummary = {
        runId,
        startedAt: runStartedAt,
        finishedAt: (0, utils_1.nowIso)(),
        feature: plan.metadata.feature,
        ticket: plan.metadata.ticket ?? null,
        env: plan.metadata.env ?? null,
        steps: results,
        context
    };
    await fs_1.promises.writeFile(path_1.default.join(runDir, "00_runSummary.json"), JSON.stringify(runSummary, null, 2), "utf-8");
    const indexHtml = buildIndexHtml(runSummary);
    await fs_1.promises.writeFile(path_1.default.join(runDir, "index.html"), indexHtml, "utf-8");
    logRunFinish(runId, results);
}
function buildIndexHtml(summary) {
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
function ensureRequires(step, context) {
    if (!step.requires) {
        return;
    }
    for (const key of step.requires) {
        if (!context[key]) {
            throw new Error(`Missing required context value: ${key}`);
        }
    }
}
function getBehaviorActions(behaviorId, behaviors, context) {
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
    return (0, context_1.resolveTemplatesDeep)(behavior.actions, context);
}
function logRunStart(runId, plan, outDir, totalSteps) {
    const metadata = [
        `feature=${plan.metadata.feature}`,
        plan.metadata.ticket ? `ticket=${plan.metadata.ticket}` : null,
        plan.metadata.env ? `env=${plan.metadata.env}` : null
    ]
        .filter(Boolean)
        .join(" ");
    console.log(`🚀 Run ${runId} started (${totalSteps} steps) ${metadata}`.trim());
    console.log(`📂 Output: ${path_1.default.resolve(outDir)}`);
}
function logStepStart(index, total, step) {
    const label = step.id ?? step.type;
    const details = describeStep(step);
    console.log(`➡️  Step ${String(index).padStart(2, "0")}/${total} ${label} (${step.type})${details}`);
}
function logStepSuccess(index, total, step, outputs) {
    const label = step.id ?? step.type;
    const outputSummary = describeOutputs(outputs);
    console.log(`✅ Step ${String(index).padStart(2, "0")}/${total} ${label} OK${outputSummary}`);
}
function logStepFailure(index, total, step, notes) {
    const label = step.id ?? step.type;
    console.log(`❌ Step ${String(index).padStart(2, "0")}/${total} ${label} FAIL: ${notes}`);
}
function logStopOnFailure() {
    console.log("🛑 Stop on failure (failPolicy=stop)");
}
function logRunFinish(runId, results) {
    const counts = results.reduce((acc, item) => {
        acc[item.status] += 1;
        return acc;
    }, { OK: 0, FAIL: 0, SKIPPED: 0 });
    console.log(`🏁 Run ${runId} finished: OK=${counts.OK} FAIL=${counts.FAIL} SKIPPED=${counts.SKIPPED}`);
}
function describeStep(step) {
    if (step.type === "browser" || step.type === "cloudwatch") {
        const parts = [
            step.behaviorId ? `behavior=${step.behaviorId}` : null,
            step.type === "cloudwatch" && step.config?.retries !== undefined
                ? `retries=${step.config.retries}`
                : null
        ].filter(Boolean);
        return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
    }
    if (step.type === "swagger") {
        const config = step.config ?? {};
        const parts = [
            step.behaviorId ? `behavior=${step.behaviorId}` : null,
            config.operationId ? `operationId=${config.operationId}` : null,
            config.path && config.method ? `path=${config.method.toUpperCase()} ${config.path}` : null
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
            sql.queryPath ? `query=${path_1.default.basename(sql.queryPath)}` : null,
            sql.resultPath ? `result=${path_1.default.basename(sql.resultPath)}` : null,
            sql.dbPath ? `db=${path_1.default.basename(sql.dbPath)}` : null,
            sql.expectRows !== undefined ? `expectRows=${sql.expectRows}` : null
        ].filter(Boolean);
        return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
    }
    return "";
}
function describeOutputs(outputs) {
    const parts = [];
    if (typeof outputs.rows === "number") {
        parts.push(`rows=${outputs.rows}`);
    }
    if (typeof outputs.attempts === "number") {
        parts.push(`attempts=${outputs.attempts}`);
    }
    if (typeof outputs.screenshot === "string") {
        parts.push(`screenshot=${outputs.screenshot}`);
    }
    return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
}
function renderArtifacts(outputs) {
    const stepDir = typeof outputs.stepDir === "string" ? outputs.stepDir : "";
    if (!stepDir) {
        return "-";
    }
    const links = [];
    addArtifactLink(links, stepDir, outputs.screenshot, "screenshot");
    addArtifactLink(links, stepDir, outputs.query, "query");
    addArtifactLink(links, stepDir, outputs.result, "result");
    addArtifactLink(links, stepDir, outputs.evidence, "evidence");
    return links.length > 0 ? links.join("") : "-";
}
function addArtifactLink(links, stepDir, filename, label) {
    if (typeof filename !== "string" || filename.length === 0) {
        return;
    }
    const href = `${stepDir}/${filename}`;
    links.push(`<a class="artifact" href="${href}">${label}</a>`);
}
async function finalizeStep(stepDir, originalStep, resolvedStep, status, startedAt, outputs, notes) {
    const result = {
        id: resolvedStep.id ?? resolvedStep.type,
        type: resolvedStep.type,
        status,
        startedAt,
        finishedAt: (0, utils_1.nowIso)(),
        inputs: resolvedStep ?? originalStep,
        outputs,
        notes
    };
    await fs_1.promises.writeFile(path_1.default.join(stepDir, "metadata.json"), JSON.stringify(result, null, 2), "utf-8");
}
