export type StepType = "browser" | "swagger" | "cloudwatch" | "sqlEvidence";

export type ExportRule =
  | {
      source: "sql";
      column: string;
      row?: number;
    }
  | {
      source: "responseText";
      regex?: string;
      jsonPath?: string;
    };

export interface StepConfig {
  operationId?: string;
  path?: string;
  method?: string;
  responseSelector?: string;
  retries?: number;
  retryDelayMs?: number;
  sql?: {
    queryPath?: string;
    resultPath?: string;
    expectRows?: number;
    adapter?: "sqlite";
    dbPath?: string;
    query?: string;
  };
}

export interface PlanMetadata {
  feature: string;
  ticket?: string;
  env?: string;
}

export interface PlanStep {
  id?: string;
  type: StepType;
  behaviorId?: string;
  exports?: Record<string, ExportRule>;
  requires?: string[];
  config?: StepConfig;
}

export interface Plan {
  metadata: PlanMetadata;
  steps: PlanStep[];
  failPolicy?: "stop" | "continue";
  behaviorsPath?: string;
  openapiPath?: string;
  sqlPresetsPath?: string;
}

export interface StepResult {
  id: string;
  type: StepType;
  status: "OK" | "FAIL" | "SKIPPED";
  startedAt: string;
  finishedAt: string;
  inputs: unknown;
  outputs: Record<string, unknown>;
  notes?: string;
}
