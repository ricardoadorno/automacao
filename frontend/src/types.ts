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
  validationErrors?: Array<{ path: string; message: string }>;
};

export type Execution = {
  executionId: string;
  runId?: string;
  planPath: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  output?: string[];
  fromStep?: number;
  toStep?: number;
  selectedSteps?: number[] | null;
  resumeFrom?: string | null;
};

export type RunSummary = {
  runId: string;
  planPath?: string | null;
  fromStep?: number | null;
  toStep?: number | null;
  selectedSteps?: number[] | null;
  resumeFrom?: string | null;
  feature?: string;
  ticket?: string;
  env?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  steps?: number;
  cacheHits?: number;
  counts?: { OK: number; FAIL: number; SKIPPED: number };
  logsUrl?: string;
};

export type RunDetailArtifact = {
  label: string;
  filename: string;
  url: string;
  kind: "image" | "html" | "file";
};

export type RunDetailStep = {
  id: string;
  type: string;
  status: string;
  stepDir: string;
  artifacts: RunDetailArtifact[];
};

export type RunDetails = {
  runId: string;
  summary: Record<string, unknown>;
  steps: RunDetailStep[];
};

export type ReportBlock = {
  id: string;
  type: "h1" | "h2" | "h3" | "h4" | "p" | "small" | "evidence";
  text?: string;
  label?: string;
  caption?: string;
  runId?: string;
  stepId?: string;
  filename?: string;
  stepDir?: string;
  enabled?: boolean;
};

export type ReportDocument = {
  name: string;
  runId: string;
  blocks: ReportBlock[];
};

export type SavedReport = {
  id: string;
  name: string;
  runId: string;
  blocks: ReportBlock[];
  createdAt: string;
  updatedAt: string;
  exports?: { jsonUrl?: string; htmlUrl?: string; docxUrl?: string; generatedAt?: string };
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
