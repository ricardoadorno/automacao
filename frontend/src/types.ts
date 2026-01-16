export type InputRow = { key: string; value: string };

export type InputsDraft = {
  defaultsRows: InputRow[];
  overridesRows: InputRow[];
  itemsRows: string[];
  envPrefix: string;
  errors?: string[];
};

export type PlanConfig = {
  failPolicy: string;
  cacheEnabled: boolean;
  cacheDir: string;
  envPrefix: string;
  defaultsCount: number;
  overridesCount: number;
  itemsCount: number;
  reuseSession: boolean;
  headless: boolean | null;
  channel: string;
  behaviorsPath: string;
  curlPath: string;
};

export type PlanInputs = {
  defaults?: Record<string, unknown>;
  overrides?: Record<string, unknown>;
  envPrefix?: string;
  items?: Array<Record<string, unknown>>;
};

export type PlanStep = {
  index: number;
  id: string;
  type: string;
  description: string;
  details?: Record<string, unknown> | null;
  artifacts?: string[];
  raw?: Record<string, unknown> | null;
};

export type Plan = {
  path: string;
  feature: string;
  ticket: string;
  env: string;
  stepsCount: number;
  steps: PlanStep[];
  config?: PlanConfig;
  inputs?: PlanInputs | null;
};

export type Execution = {
  executionId: string;
  planPath: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  output?: string[];
  fromStep?: number;
  toStep?: number;
  selectedSteps?: number[] | null;
};

export type RunSummary = {
  runId: string;
  planPath?: string | null;
  fromStep?: number | null;
  toStep?: number | null;
  selectedSteps?: number[] | null;
  feature?: string;
  ticket?: string;
  env?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  steps?: number;
  cacheHits?: number;
  counts?: { OK: number; FAIL: number; SKIPPED: number };
};

export type Trigger = {
  id: string;
  name: string;
  provider: string;
  target: string;
  logsUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
};

export type Range = { fromStep?: number; toStep?: number };
