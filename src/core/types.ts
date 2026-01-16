import { Context } from "./context";

export type StepType = "browser" | "api" | "sqlEvidence" | "cli" | "specialist";

export type ExportRule =
  | {
      source: "sql";
      column: string;
      row?: number;
    }
  | {
      source: "responseText" | "responseData";
      regex?: string;
      jsonPath?: string;
    }
  | {
      source: "stdout" | "stderr";
      regex?: string;
      jsonPath?: string;
    };

export interface StepConfig {
  retries?: number;
  retryDelayMs?: number;
  browser?: {
    viewport?: {
      width: number;
      height: number;
      deviceScaleFactor?: number;
    };
    zoom?: number;
    capture?: {
      mode?: "full" | "viewport" | "element" | "tiles";
      selector?: string;
      tiles?: {
        direction?: "horizontal" | "vertical" | "both";
        overlapPx?: number;
        maxTiles?: number;
        waitMs?: number;
      };
    };
  };
  cli?: {
    command?: string;
    args?: string[];
    cwd?: string;
    timeoutMs?: number;
    env?: Record<string, string>;
    errorPatterns?: string[];
    successCriteria?: {
      stdoutRegex?: string;
      stderrRegex?: string;
      stdoutJsonPath?: string;
      stderrJsonPath?: string;
    };
    pipeline?: {
      pre?: Array<{ command: string; args?: string[] }>;
      script: { command: string; args?: string[] };
      post?: Array<{ command: string; args?: string[] }>;
    };
  };
  sql?: {
    queryPath?: string;
    resultPath?: string;
    expectRows?: number;
    adapter?: "sqlite" | "mysql";
    dbPath?: string;
    query?: string;
    mysql?: {
      host: string;
      port?: number;
      user: string;
      password: string;
      database: string;
    };
  };
  specialist?: {
    task: "writeFile";
    outputPath: string;
    content: string;
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
  description?: string;
  behaviorId?: string;
  exports?: Record<string, ExportRule>;
  requires?: string[];
  config?: StepConfig;
  cache?: boolean;
  loop?: {
    items?: Context[];
    usePlanItems?: boolean;
  };
}

export interface Plan {
  metadata: PlanMetadata;
  context?: Context;
  steps: PlanStep[];
  failPolicy?: "stop" | "continue";
  behaviorsPath?: string;
  curlPath?: string;
  sqlPresetsPath?: string;
  cache?: {
    enabled?: boolean;
    dir?: string;
  };
  inputs?: {
    defaults?: Context;
    overrides?: Context;
    envPrefix?: string;
    items?: Context[];
  };
  browser?: {
    channel?: "chrome" | "msedge";
    headless?: boolean;
    userDataDir?: string;
    viewport?: {
      width: number;
      height: number;
      deviceScaleFactor?: number;
    };
    reuseSession?: boolean;
  };
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
