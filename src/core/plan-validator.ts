import { Plan } from "./types";

export type PlanValidationError = { path: string; message: string };

export function validatePlanStructure(input: unknown): PlanValidationError[] {
  const errors: PlanValidationError[] = [];
  if (!input || typeof input !== "object") {
    return [{ path: "$", message: "plan must be an object" }];
  }

  const plan = input as Plan;
  if (!plan.metadata || typeof plan.metadata !== "object") {
    errors.push({ path: "metadata", message: "metadata is required" });
  } else {
    const metadata = plan.metadata as unknown as Record<string, unknown>;
    if (!isNonEmptyString(metadata.feature)) {
      errors.push({ path: "metadata.feature", message: "feature is required" });
    }
  }

  if (!Array.isArray(plan.steps)) {
    errors.push({ path: "steps", message: "steps must be an array" });
  } else {
    plan.steps.forEach((step, index) => {
      const basePath = `steps[${index}]`;
      if (!step || typeof step !== "object") {
        errors.push({ path: basePath, message: "step must be an object" });
        return;
      }
      const stepRecord = step as unknown as Record<string, unknown>;
      if (!isNonEmptyString(stepRecord.type)) {
        errors.push({ path: `${basePath}.type`, message: "type is required" });
        return;
      }
      const stepType = String(stepRecord.type);
      validateStep(stepRecord, stepType, basePath, errors);
    });
  }

  if (Array.isArray(plan.steps) && plan.steps.some((step) => step?.type === "browser")) {
    if (!isNonEmptyString(plan.behaviorsPath)) {
      errors.push({
        path: "behaviorsPath",
        message: "behaviorsPath is required when using browser steps"
      });
    }
  }

  if (Array.isArray(plan.steps) && plan.steps.some((step) => step?.type === "api")) {
    if (!isNonEmptyString(plan.curlPath)) {
      errors.push({
        path: "curlPath",
        message: "curlPath is required when using api steps"
      });
    }
  }

  return errors;
}

function validateStep(
  step: Record<string, unknown>,
  type: string,
  basePath: string,
  errors: PlanValidationError[]
) {
  if (type === "browser") {
    if (!isNonEmptyString(step.behaviorId)) {
      errors.push({
        path: `${basePath}.behaviorId`,
        message: "behaviorId is required for browser steps"
      });
    }
    return;
  }

  if (type === "api") {
    return;
  }

  if (type === "sqlEvidence") {
    const sql = (step.config as Record<string, unknown> | undefined)?.sql as
      | Record<string, unknown>
      | undefined;
    if (!sql || typeof sql !== "object") {
      errors.push({ path: `${basePath}.config.sql`, message: "config.sql is required" });
      return;
    }
    const adapter = String(sql.adapter || "files");
    if (adapter === "sqlite") {
      if (!isNonEmptyString(sql.dbPath)) {
        errors.push({ path: `${basePath}.config.sql.dbPath`, message: "dbPath is required" });
      }
      if (!isNonEmptyString(sql.query)) {
        errors.push({ path: `${basePath}.config.sql.query`, message: "query is required" });
      }
      return;
    }
    if (adapter === "mysql") {
      const hasQuery = isNonEmptyString(sql.query) || isNonEmptyString(sql.queryPath);
      if (!hasQuery) {
        errors.push({
          path: `${basePath}.config.sql.query`,
          message: "query or queryPath is required"
        });
      }
      if (!sql.mysql || typeof sql.mysql !== "object") {
        errors.push({ path: `${basePath}.config.sql.mysql`, message: "mysql config is required" });
      }
      return;
    }
    if (!isNonEmptyString(sql.queryPath)) {
      errors.push({ path: `${basePath}.config.sql.queryPath`, message: "queryPath is required" });
    }
    if (!isNonEmptyString(sql.resultPath)) {
      errors.push({ path: `${basePath}.config.sql.resultPath`, message: "resultPath is required" });
    }
    return;
  }

  if (type === "tabular") {
    const tabular = (step.config as Record<string, unknown> | undefined)?.tabular as
      | Record<string, unknown>
      | undefined;
    if (!tabular || typeof tabular !== "object") {
      errors.push({ path: `${basePath}.config.tabular`, message: "config.tabular is required" });
      return;
    }
    if (!isNonEmptyString(tabular.sourcePath)) {
      errors.push({
        path: `${basePath}.config.tabular.sourcePath`,
        message: "sourcePath is required"
      });
    }
    return;
  }

  if (type === "cli") {
    const cli = (step.config as Record<string, unknown> | undefined)?.cli as
      | Record<string, unknown>
      | undefined;
    if (!cli || typeof cli !== "object") {
      errors.push({ path: `${basePath}.config.cli`, message: "config.cli is required" });
      return;
    }
    if (!isNonEmptyString(cli.command)) {
      errors.push({ path: `${basePath}.config.cli.command`, message: "command is required" });
    }
    return;
  }

  if (type === "specialist") {
    const specialist = (step.config as Record<string, unknown> | undefined)?.specialist as
      | Record<string, unknown>
      | undefined;
    if (!specialist || typeof specialist !== "object") {
      errors.push({
        path: `${basePath}.config.specialist`,
        message: "config.specialist is required"
      });
      return;
    }
    if (!isNonEmptyString(specialist.task)) {
      errors.push({ path: `${basePath}.config.specialist.task`, message: "task is required" });
    }
    if (!isNonEmptyString(specialist.outputPath)) {
      errors.push({
        path: `${basePath}.config.specialist.outputPath`,
        message: "outputPath is required"
      });
    }
    return;
  }

  if (type === "logstream") {
    const logstream = (step.config as Record<string, unknown> | undefined)?.logstream as
      | Record<string, unknown>
      | undefined;
    if (!logstream || typeof logstream !== "object") {
      errors.push({
        path: `${basePath}.config.logstream`,
        message: "config.logstream is required"
      });
      return;
    }
    if (!isNonEmptyString(logstream.url)) {
      errors.push({ path: `${basePath}.config.logstream.url`, message: "url is required" });
    }
  }
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
