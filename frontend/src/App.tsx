import { useEffect, useMemo, useRef, useState } from "react";
import { PlanDetail } from "./components/PlanDetail";
import {
  parseItemsRows,
  rowsToObject,
  toRows
} from "./lib/inputs";
import {
  Execution,
  InputsDraft,
  Plan,
  PlanInputs,
  PlanStep,
  ReportBlock,
  ReportDocument,
  Range,
  RunDetails,
  RunSummary,
  Trigger
} from "./types";

type TabKey = "plans" | "examples" | "executions" | "runs" | "reports" | "triggers";

type Toast = { message: string; tone?: "success" | "error" | "info" } | null;

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json();
  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Request failed";
    throw new Error(message);
  }
  return data;
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("plans");
  const [toast, setToast] = useState<Toast>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [examples, setExamples] = useState<Plan[]>([]);
  const [examplesLoading, setExamplesLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState("");
  const [exampleFilter, setExampleFilter] = useState("");
  const [stepSelections, setStepSelections] = useState<Record<string, Record<number, boolean>>>({});
  const [rangeDrafts, setRangeDrafts] = useState<Record<string, { from?: string; to?: string }>>({});
  const [inputsDrafts, setInputsDrafts] = useState<Record<string, InputsDraft>>({});
  const [selectedPlanPath, setSelectedPlanPath] = useState<string | null>(null);
  const [executions, setExecutions] = useState<Record<string, Execution>>({});
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [runsPage, setRunsPage] = useState(1);
  const [runsPageSize] = useState(6);
  const [runsTotal, setRunsTotal] = useState(0);
  const [runsLoading, setRunsLoading] = useState(false);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [triggersLoading, setTriggersLoading] = useState(false);
  const [reportRuns, setReportRuns] = useState<RunSummary[]>([]);
  const [reportRunsLoading, setReportRunsLoading] = useState(false);
  const [reportRunId, setReportRunId] = useState("");
  const [reportDetails, setReportDetails] = useState<RunDetails | null>(null);
  const [reportDetailsByRun, setReportDetailsByRun] = useState<Record<string, RunDetails>>({});
  const [reportName, setReportName] = useState("relatorio");
  const [reportBlocks, setReportBlocks] = useState<ReportBlock[]>([]);
  const [reportLinks, setReportLinks] = useState<{ jsonUrl?: string; htmlUrl?: string; docxUrl?: string } | null>(null);
  const [evidencePicker, setEvidencePicker] = useState<{
    open: boolean;
    blockId?: string;
    runId?: string;
    stepId?: string;
    filename?: string;
  }>({ open: false });
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [logFilters, setLogFilters] = useState<Record<string, { text: string; level: "all" | "error" }>>({});
  const [triggerForm, setTriggerForm] = useState({
    name: "",
    provider: "eventbridge",
    target: "",
    logsUrl: ""
  });
  const pollersRef = useRef<Record<string, number>>({});
  const triggersPollerRef = useRef<number | null>(null);

  const hasExecutions = useMemo(() => Object.keys(executions).length > 0, [executions]);

  useEffect(() => {
    if (tab === "plans") {
      void loadPlans();
    }
    if (tab === "examples") {
      void loadExamples();
    }
    if (tab === "runs") {
      void loadRuns(runsPage, runsPageSize);
    }
    if (tab === "reports") {
      void loadReportRuns();
    }
    if (tab === "triggers") {
      void loadTriggers();
    }
  }, [tab, runsPage, runsPageSize]);

  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach((id) => clearInterval(id));
      pollersRef.current = {};
      if (triggersPollerRef.current) {
        clearInterval(triggersPollerRef.current);
        triggersPollerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (tab === "triggers") {
      if (!triggersPollerRef.current) {
        triggersPollerRef.current = window.setInterval(() => {
          void loadTriggers();
        }, 2500);
      }
      return () => {
        if (triggersPollerRef.current) {
          clearInterval(triggersPollerRef.current);
          triggersPollerRef.current = null;
        }
      };
    }
    if (triggersPollerRef.current) {
      clearInterval(triggersPollerRef.current);
      triggersPollerRef.current = null;
    }
    return;
  }, [tab]);

  useEffect(() => {
    const handler = () => {
      const next = getPlanFromHash();
      setSelectedPlanPath(next || null);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    const allPlans = [...plans, ...examples];
    setStepSelections((current) => {
      const next: Record<string, Record<number, boolean>> = {};
      for (const plan of allPlans) {
        const existing = current[plan.path];
        if (existing) {
          next[plan.path] = existing;
          continue;
        }
        const allSteps: Record<number, boolean> = {};
        for (const step of plan.steps) {
          allSteps[step.index] = true;
        }
        next[plan.path] = allSteps;
      }
      return next;
    });
    setInputsDrafts((current) => {
      const next: Record<string, InputsDraft> = { ...current };
      for (const plan of allPlans) {
        if (next[plan.path]) {
          continue;
        }
        const defaultsRows = toRows(plan.inputs?.defaults);
        const overridesRows = toRows(plan.inputs?.overrides);
        const itemsRows = Array.isArray(plan.inputs?.items)
          ? plan.inputs?.items.map((item) => JSON.stringify(item, null, 2))
          : [];
        next[plan.path] = {
          defaultsRows,
          overridesRows,
          itemsRows,
          envPrefix: plan.inputs?.envPrefix ?? "",
          errors: []
        };
      }
      return next;
    });
    setRangeDrafts((current) => {
      const next = { ...current };
      for (const plan of allPlans) {
        if (!next[plan.path]) {
          next[plan.path] = { from: "", to: "" };
        }
      }
      return next;
    });

    if (!selectedPlanPath && plans.length > 0) {
      const planFromHash = getPlanFromHash();
      if (planFromHash) {
        setSelectedPlanPath(planFromHash);
      }
    }
  }, [plans, examples]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("automacao-plan-inputs");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, InputsDraft>;
      setInputsDrafts((current) => ({ ...parsed, ...current }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("automacao-plan-inputs", JSON.stringify(inputsDrafts));
    } catch {
      // ignore
    }
  }, [inputsDrafts]);

  useEffect(() => {
    if (!reportRunId) {
      setReportDetails(null);
      return;
    }
    void loadRunDetails(reportRunId, { setActive: true });
    setReportLinks(null);
  }, [reportRunId]);

  async function loadPlans() {
    setPlansLoading(true);
    try {
      const data = await apiFetch<{ plans: Plan[] }>("/api/scenarios");
      setPlans(data.plans ?? []);
    } catch (error) {
      showToast(error);
    } finally {
      setPlansLoading(false);
    }
  }

  async function loadExamples() {
    setExamplesLoading(true);
    try {
      const data = await apiFetch<{ plans: Plan[] }>("/api/examples");
      setExamples(data.plans ?? []);
    } catch (error) {
      showToast(error);
    } finally {
      setExamplesLoading(false);
    }
  }

  async function runPlan(
    planPath: string,
    range?: Range,
    options: {
      switchTab?: boolean;
      selectedSteps?: number[];
      inputs?: PlanInputs;
    } = {}
  ) {
    try {
      const payload: Record<string, unknown> = { planPath };
      if (range?.fromStep) payload.fromStep = range.fromStep;
      if (range?.toStep) payload.toStep = range.toStep;
      if (options.selectedSteps && options.selectedSteps.length > 0) {
        payload.selectedSteps = options.selectedSteps;
      }
      if (options.inputs) {
        payload.inputs = options.inputs;
      }
      const data = await apiFetch<{ executionId: string; fromStep?: number; toStep?: number }>(
        "/api/run",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const execution: Execution = {
        executionId: data.executionId,
        planPath,
        status: "running",
        startedAt: new Date().toISOString(),
        fromStep: data.fromStep,
        toStep: data.toStep
      };
      setExecutions((current) => ({ ...current, [execution.executionId]: execution }));
      showToast({ message: "Execution started", tone: "success" });
      if (options.switchTab !== false) {
        setTab("executions");
      }
      startPolling(execution.executionId);
    } catch (error) {
      showToast(error);
    }
  }

  function startPolling(executionId: string) {
    if (pollersRef.current[executionId]) {
      return;
    }
    const timerId = window.setInterval(async () => {
      try {
        const data = await apiFetch<Execution>(`/api/status?id=${executionId}`);
        setExecutions((current) => ({ ...current, [executionId]: data }));
        if (data.status !== "running") {
          clearInterval(timerId);
          delete pollersRef.current[executionId];
          void loadRuns(runsPage, runsPageSize);
        }
      } catch (error) {
        clearInterval(timerId);
        delete pollersRef.current[executionId];
      }
    }, 2000);
    pollersRef.current[executionId] = timerId;
  }

  async function loadRuns(page: number, pageSize: number) {
    setRunsLoading(true);
    try {
      const data = await apiFetch<{ runs: RunSummary[]; page: number; total: number }>(
        `/api/runs?page=${page}&pageSize=${pageSize}`
      );
      setRuns(data.runs ?? []);
      setRunsTotal(data.total ?? 0);
    } catch (error) {
      showToast(error);
    } finally {
      setRunsLoading(false);
    }
  }

  async function loadReportRuns() {
    setReportRunsLoading(true);
    try {
      const data = await apiFetch<{ runs: RunSummary[] }>(`/api/runs?page=1&pageSize=20`);
      const nextRuns = data.runs ?? [];
      setReportRuns(nextRuns);
      if (!reportRunId && nextRuns.length > 0) {
        setReportRunId(nextRuns[0].runId);
      }
    } catch (error) {
      showToast(error);
    } finally {
      setReportRunsLoading(false);
    }
  }

  async function loadRunDetails(runId: string, options: { setActive?: boolean } = {}) {
    try {
      const data = await apiFetch<RunDetails>(`/api/run-details?runId=${encodeURIComponent(runId)}`);
      setReportDetailsByRun((current) => ({ ...current, [runId]: data }));
      if (options.setActive) {
        setReportDetails(data);
      }
    } catch (error) {
      showToast(error);
    }
  }

  async function loadTriggers() {
    setTriggersLoading(true);
    try {
      const data = await apiFetch<{ triggers: Trigger[] }>("/api/triggers");
      setTriggers(data.triggers ?? []);
    } catch (error) {
      showToast(error);
    } finally {
      setTriggersLoading(false);
    }
  }

  async function createTrigger(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = await apiFetch<{ trigger: Trigger }>("/api/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(triggerForm)
      });
      setTriggers((current) => [data.trigger, ...current]);
      setTriggerForm({ name: "", provider: "eventbridge", target: "", logsUrl: "" });
      showToast({ message: "Trigger created", tone: "success" });
    } catch (error) {
      showToast(error);
    }
  }

  async function updateTrigger(id: string, payload: Partial<Trigger>) {
    try {
      const data = await apiFetch<{ trigger: Trigger }>("/api/triggers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload })
      });
      setTriggers((current) => current.map((item) => (item.id === id ? data.trigger : item)));
    } catch (error) {
      showToast(error);
    }
  }

  async function deleteTrigger(id: string) {
    try {
      await apiFetch("/api/triggers?id=" + encodeURIComponent(id), { method: "DELETE" });
      setTriggers((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      showToast(error);
    }
  }

  async function deleteRun(runId: string) {
    if (!window.confirm("Remove this run and all its artifacts?")) {
      return;
    }
    try {
      await apiFetch(`/api/runs?runId=${encodeURIComponent(runId)}`, { method: "DELETE" });
      if (runs.length <= 1 && runsPage > 1) {
        setRunsPage(runsPage - 1);
      } else {
        void loadRuns(runsPage, runsPageSize);
      }
      if (reportRunId === runId) {
        setReportRunId("");
        setReportDetails(null);
      }
      setReportRuns((current) => current.filter((item) => item.runId !== runId));
      showToast({ message: "Run removed", tone: "success" });
    } catch (error) {
      showToast(error);
    }
  }

  async function stopExecution(executionId: string) {
    try {
      const data = await apiFetch<{ status?: string }>(`/api/stop?id=${encodeURIComponent(executionId)}`);
      setExecutions((current) => ({
        ...current,
        [executionId]: { ...current[executionId], status: data.status || "stopped" }
      }));
      showToast({ message: "Execution stopped", tone: "success" });
    } catch (error) {
      showToast(error);
    }
  }

  function showToast(value: unknown) {
    if (!value) return;
    if (value instanceof Error) {
      setToast({ message: value.message, tone: "error" });
      return;
    }
    if (typeof value === "string") {
      setToast({ message: value, tone: "info" });
      return;
    }
    if (typeof value === "object" && value && "message" in value) {
      const message = String((value as { message?: string }).message || "");
      setToast({ message, tone: "info" });
      return;
    }
    setToast({ message: "Done", tone: "info" });
  }

  function addReportBlock(type: ReportBlock["type"]) {
    const id = `block-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const base: ReportBlock = { id, type, enabled: true };
    if (type === "h1" || type === "h2" || type === "p" || type === "small") {
      base.text = "";
    }
    if (type === "evidence") {
      base.label = "Evidence";
      base.caption = "";
      base.runId = reportRunId || "";
    }
    setReportBlocks((current) => [...current, base]);
  }

  function updateReportBlock(id: string, patch: Partial<ReportBlock>) {
    setReportBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...patch } : block))
    );
  }

  function moveReportBlock(id: string, direction: -1 | 1) {
    setReportBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      if (index === -1) return current;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const updated = [...current];
      const [item] = updated.splice(index, 1);
      updated.splice(nextIndex, 0, item);
      return updated;
    });
  }

  function removeReportBlock(id: string) {
    setReportBlocks((current) => current.filter((block) => block.id !== id));
  }

  function buildReportDocument(): ReportDocument {
    return {
      name: reportName.trim() || "relatorio",
      runId: reportRunId,
      blocks: reportBlocks
    };
  }

  function getReportBaseRunId(blocks: ReportBlock[]) {
    if (reportRunId) {
      return reportRunId;
    }
    const firstEvidence = blocks.find((block) => block.type === "evidence" && block.runId);
    return firstEvidence?.runId ?? "";
  }

  async function generateReport() {
    const report = buildReportDocument();
    const baseRunId = getReportBaseRunId(report.blocks);
    if (!baseRunId) {
      showToast("Select an evidence before generating");
      return;
    }
    try {
      const data = await apiFetch<{ jsonUrl?: string; htmlUrl?: string; docxUrl?: string }>(
        "/api/reports/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: baseRunId,
            name: reportName,
            report
          })
        }
      );
      setReportLinks(data);
      showToast({ message: "Report generated", tone: "success" });
    } catch (error) {
      showToast(error);
    }
  }


  function openEvidencePicker(blockId: string) {
    const block = reportBlocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }
    const runId = block.runId || reportRunId || "";
    setEvidencePicker({
      open: true,
      blockId,
      runId,
      stepId: block.stepId,
      filename: block.filename
    });
    setEvidenceSearch("");
    for (const run of reportRuns) {
      if (!reportDetailsByRun[run.runId]) {
        void loadRunDetails(run.runId);
      }
    }
  }

  function closeEvidencePicker() {
    setEvidencePicker({ open: false });
  }

  function confirmEvidencePicker() {
    if (!evidencePicker.blockId) {
      closeEvidencePicker();
      return;
    }
    const step = getRunStep(
      getRunDetails(reportDetailsByRun, evidencePicker.runId),
      evidencePicker.stepId
    );
    updateReportBlock(evidencePicker.blockId, {
      runId: evidencePicker.runId,
      stepId: evidencePicker.stepId,
      filename: evidencePicker.filename,
      stepDir: step?.stepDir || ""
    });
    closeEvidencePicker();
  }

  function toggleStepSelection(planPath: string, stepIndex: number) {
    setStepSelections((current) => ({
      ...current,
      [planPath]: { ...current[planPath], [stepIndex]: !current[planPath]?.[stepIndex] }
    }));
  }

  function toggleAllSteps(planPath: string, steps: PlanStep[]) {
    setStepSelections((current) => {
      const existing = current[planPath] || {};
      const allSelected = steps.every((step) => existing[step.index]);
      const next: Record<number, boolean> = {};
      for (const step of steps) {
        next[step.index] = !allSelected;
      }
      return { ...current, [planPath]: next };
    });
  }

  function getSelectedSteps(planPath: string) {
    const selections = stepSelections[planPath] || {};
    return Object.keys(selections)
      .filter((key) => selections[Number(key)])
      .map((key) => Number(key))
      .sort((a, b) => a - b);
  }

  function selectPlan(planPath: string) {
    setSelectedPlanPath(planPath);
    window.location.hash = `plan=${encodeURIComponent(planPath)}`;
  }

  function clearSelectedPlan() {
    setSelectedPlanPath(null);
    window.location.hash = "";
  }

  function updateInputsDraft(planPath: string, patch: Partial<InputsDraft>) {
    setInputsDrafts((current) => ({
      ...current,
      [planPath]: { ...current[planPath], ...patch }
    }));
  }

  function updateRangeDraft(planPath: string, patch: { from?: string; to?: string }) {
    setRangeDrafts((current) => ({
      ...current,
      [planPath]: { ...(current[planPath] ?? {}), ...patch }
    }));
  }

  function parseRangeDraft(planPath: string, stepsCount: number) {
    const draft = rangeDrafts[planPath] || {};
    const fromRaw = draft.from?.trim();
    const toRaw = draft.to?.trim();
    const from = fromRaw ? Number.parseInt(fromRaw, 10) : undefined;
    const to = toRaw ? Number.parseInt(toRaw, 10) : undefined;
    if ((fromRaw && !Number.isFinite(from)) || (toRaw && !Number.isFinite(to))) {
      return { error: "Range must be numeric" };
    }
    if (from !== undefined && (from < 1 || from > stepsCount)) {
      return { error: "Range start out of bounds" };
    }
    if (to !== undefined && (to < 1 || to > stepsCount)) {
      return { error: "Range end out of bounds" };
    }
    if (from !== undefined && to !== undefined && from > to) {
      return { error: "Range start must be <= end" };
    }
    return { range: { fromStep: from, toStep: to } as Range };
  }

  function buildInputsPayload(planPath: string) {
    const draft = inputsDrafts[planPath];
    if (!draft) return { inputs: undefined, errors: [] as string[] };
    const rowErrors = [
      ...validateInputRows(draft.defaultsRows, "Defaults"),
      ...validateInputRows(draft.overridesRows, "Overrides")
    ];
    const defaults = rowsToObject(draft.defaultsRows);
    const overrides = rowsToObject(draft.overridesRows);
    const items = parseItemsRows(draft.itemsRows);
    const errors = [...rowErrors, ...items.errors];
    const inputs: PlanInputs = {};
    if (Object.keys(defaults).length > 0) inputs.defaults = defaults;
    if (Object.keys(overrides).length > 0) inputs.overrides = overrides;
    if (items.items.length > 0) inputs.items = items.items;
    if (draft.envPrefix.trim()) inputs.envPrefix = draft.envPrefix.trim();
    return { inputs: Object.keys(inputs).length > 0 ? inputs : undefined, errors };
  }

  function resetInputs(planPath: string) {
    const plan = plans.find((item) => item.path === planPath);
    if (!plan) return;
    updateInputsDraft(planPath, {
      defaultsRows: toRows(plan.inputs?.defaults),
      overridesRows: toRows(plan.inputs?.overrides),
      itemsRows: Array.isArray(plan.inputs?.items)
        ? plan.inputs.items.map((item) => JSON.stringify(item, null, 2))
        : [],
      envPrefix: plan.inputs?.envPrefix ?? "",
      errors: []
    });
  }

  const selectedPlan = selectedPlanPath
    ? [...plans, ...examples].find((plan) => plan.path === selectedPlanPath) ?? null
    : null;

  const totalPages = Math.max(1, Math.ceil(runsTotal / runsPageSize));
  const filteredPlans = filterPlans(plans, planFilter);
  const filteredExamples = filterPlans(examples, exampleFilter);

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Automation Dashboard</p>
          <h1>Plans, runs, and triggers in one place</h1>
          <p className="subtitle">Run plans, watch executions, and manage triggers.</p>
        </div>
        <div className="header-actions">
          <button className="ghost" onClick={() => setTab("plans")}>Plans</button>
          <button className="ghost" onClick={() => setTab("examples")}>Examples</button>
          <button className="ghost" onClick={() => setTab("executions")}>Executions</button>
          <button className="ghost" onClick={() => setTab("runs")}>Runs</button>
          <button className="ghost" onClick={() => setTab("reports")}>Reports</button>
          <button className="ghost" onClick={() => setTab("triggers")}>Triggers</button>
        </div>
      </header>

      <main className="content">
        <nav className="tabs">
          {["plans", "examples", "executions", "runs", "reports", "triggers"].map((key) => (
            <button
              key={key}
              className={`tab ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key as TabKey)}
              data-testid={`tab-${key}`}
            >
              {key}
            </button>
          ))}
        </nav>

        {tab === "plans" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Scenarios</h2>
                <p>Real workflows and production-like flows.</p>
              </div>
              <button className="primary" onClick={() => loadPlans()} disabled={plansLoading}>
                {plansLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            <div className="filter-bar">
              <input
                placeholder="Filter scenarios by name, env, ticket, path..."
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              />
              <button className="ghost" onClick={() => setPlanFilter("")}>Clear</button>
            </div>
            {plansLoading ? (
              <div className="empty">Loading plans...</div>
            ) : filteredPlans.length === 0 ? (
              <div className="empty">No plans found</div>
            ) : (
              <>
                <div className="grid" data-testid="plans-grid">
                  {filteredPlans.map((plan) => {
                    const selectedSteps = getSelectedSteps(plan.path);
                    const allStepsSelected =
                      plan.steps.length > 0 && selectedSteps.length === plan.steps.length;
                    const typeCounts = getStepTypeCounts(plan.steps);
                    const flags = getPlanFlags(plan);
                    const rangeDraft = rangeDrafts[plan.path] || { from: "", to: "" };
                    return (
                      <article
                        className={`card plan-card ${selectedSteps.length > 0 ? "selected" : ""}`}
                        data-testid="plan-card"
                        key={plan.path}
                      >
                        <div className="plan-top">
                          <div className="plan-main">
                            <div className="plan-title">
                              <h3>{plan.feature}</h3>
                              <span className="pill">{plan.stepsCount} steps</span>
                              <span className="pill scenario">scenario</span>
                              {flags.map((flag) => (
                                <span className="pill secondary" key={flag}>{flag}</span>
                              ))}
                            </div>
                            <p className="muted">{plan.path}</p>
                            <div className="selection-summary">
                              <label className="checkbox">
                                <input
                                  type="checkbox"
                                  checked={allStepsSelected}
                                  onChange={() => toggleAllSteps(plan.path, plan.steps)}
                                />
                                <span>Select all steps</span>
                              </label>
                              <span className="muted">
                                {selectedSteps.length} of {plan.steps.length} selected
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="meta">
                          {plan.ticket && <span>Ticket: {plan.ticket}</span>}
                          {plan.env && <span>Env: {plan.env}</span>}
                          {typeCounts.length > 0 && (
                            <span>Types: {typeCounts.map((item) => `${item.type} ${item.count}`).join(", ")}</span>
                          )}
                        </div>
                        {plan.config && (
                          <div className="config-grid">
                            <div>
                              <span className="label">Execution</span>
                              <strong>Fail policy: {plan.config.failPolicy || "stop"}</strong>
                              <span className="muted">
                                Cache: {plan.config.cacheEnabled ? `enabled (${plan.config.cacheDir || ".cache/steps"})` : "disabled"}
                              </span>
                            </div>
                            <div>
                              <span className="label">Inputs</span>
                              <strong>Env prefix: {plan.config.envPrefix || "none"}</strong>
                              <span className="muted">
                                Defaults: {plan.config.defaultsCount} · Overrides: {plan.config.overridesCount} · Items: {plan.config.itemsCount}
                              </span>
                            </div>
                            <div>
                              <span className="label">Browser</span>
                              <strong>{formatBrowserConfig(plan.config)}</strong>
                              <span className="muted">
                                Reuse: {plan.config.reuseSession ? "yes" : "no"} · Channel: {plan.config.channel || "default"}
                              </span>
                            </div>
                            <div>
                              <span className="label">Assets</span>
                              <strong>{formatAssetsConfig(plan.config)}</strong>
                              <span className="muted">
                                Behaviors: {plan.config.behaviorsPath ? truncatePath(plan.config.behaviorsPath) : "none"} · Curl: {plan.config.curlPath ? truncatePath(plan.config.curlPath) : "none"}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="range">
                          <label>
                            From
                            <input
                              value={rangeDraft.from ?? ""}
                              onChange={(event) => updateRangeDraft(plan.path, { from: event.target.value })}
                              placeholder="1"
                            />
                          </label>
                          <label>
                            To
                            <input
                              value={rangeDraft.to ?? ""}
                              onChange={(event) => updateRangeDraft(plan.path, { to: event.target.value })}
                              placeholder={String(plan.steps.length)}
                            />
                          </label>
                          <button
                            className="ghost"
                            onClick={() => {
                              const parsed = parseRangeDraft(plan.path, plan.steps.length);
                              if (parsed.error) {
                                showToast(parsed.error);
                                return;
                              }
                              const payload = buildInputsPayload(plan.path);
                              if (payload.errors.length > 0) {
                                updateInputsDraft(plan.path, { errors: payload.errors });
                                showToast(payload.errors.join("; "));
                                return;
                              }
                              void runPlan(plan.path, parsed.range, { inputs: payload.inputs });
                            }}
                          >
                            Run range
                          </button>
                        </div>
                        <div className="actions">
                          <button className="ghost" onClick={() => selectPlan(plan.path)}>
                            View plan
                          </button>
                          <button
                            className="primary"
                            onClick={() => {
                              if (selectedSteps.length === 0) {
                                showToast("Select at least one step");
                                return;
                              }
                              const payload = buildInputsPayload(plan.path);
                              if (payload.errors.length > 0) {
                                updateInputsDraft(plan.path, { errors: payload.errors });
                                showToast(payload.errors.join("; "));
                                return;
                              }
                              void runPlan(plan.path, undefined, {
                                selectedSteps,
                                inputs: payload.inputs
                              });
                            }}
                          >
                            Run selected steps
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {selectedPlan && (
                  <div className="modal-backdrop" onClick={clearSelectedPlan}>
                    <div className="modal" onClick={(event) => event.stopPropagation()}>
                      <PlanDetail
                        plan={selectedPlan}
                        selectedSteps={getSelectedSteps(selectedPlan.path)}
                        selections={stepSelections[selectedPlan.path] || {}}
                        inputsDraft={inputsDrafts[selectedPlan.path]}
                        onClose={clearSelectedPlan}
                        onToggleStep={(stepIndex) => toggleStepSelection(selectedPlan.path, stepIndex)}
                        onToggleAllSteps={() => toggleAllSteps(selectedPlan.path, selectedPlan.steps)}
                        onInputsChange={(patch) => updateInputsDraft(selectedPlan.path, patch)}
                        onRun={async () => {
                          const selectedSteps = getSelectedSteps(selectedPlan.path);
                          if (selectedSteps.length === 0) {
                            showToast("Select at least one step");
                            return;
                          }
                          const payload = buildInputsPayload(selectedPlan.path);
                          if (payload.errors.length > 0) {
                            updateInputsDraft(selectedPlan.path, { errors: payload.errors });
                            showToast(payload.errors.join("; "));
                            return;
                          }
                          await runPlan(selectedPlan.path, undefined, {
                            selectedSteps,
                            inputs: payload.inputs
                          });
                        }}
                        onReset={() => resetInputs(selectedPlan.path)}
                        formatStepDetails={formatStepDetails}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {tab === "examples" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Examples</h2>
                <p>Sample plans for demos and quick checks.</p>
              </div>
              <button className="primary" onClick={() => loadExamples()} disabled={examplesLoading}>
                {examplesLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            <div className="filter-bar">
              <input
                placeholder="Filter examples by name, env, ticket, path..."
                value={exampleFilter}
                onChange={(event) => setExampleFilter(event.target.value)}
              />
              <button className="ghost" onClick={() => setExampleFilter("")}>Clear</button>
            </div>
            {examplesLoading ? (
              <div className="empty">Loading examples...</div>
            ) : filteredExamples.length === 0 ? (
              <div className="empty">No examples found</div>
            ) : (
              <div className="grid" data-testid="plans-grid">
                {filteredExamples.map((plan) => {
                  const selectedSteps = getSelectedSteps(plan.path);
                  const typeCounts = getStepTypeCounts(plan.steps);
                  const rangeDraft = rangeDrafts[plan.path] || { from: "", to: "" };
                  return (
                    <article className="card plan-card" data-testid="plan-card" key={plan.path}>
                      <div className="plan-top">
                        <div className="plan-main">
                          <div className="plan-title">
                            <h3>{plan.feature}</h3>
                            <span className="pill">{plan.stepsCount} steps</span>
                            <span className="pill example">example</span>
                          </div>
                          <p className="muted">{plan.path}</p>
                        </div>
                      </div>
                      <div className="meta">
                        {plan.ticket && <span>Ticket: {plan.ticket}</span>}
                        {plan.env && <span>Env: {plan.env}</span>}
                        {typeCounts.length > 0 && (
                          <span>Types: {typeCounts.map((item) => `${item.type} ${item.count}`).join(", ")}</span>
                        )}
                      </div>
                      <div className="range">
                        <label>
                          From
                          <input
                            value={rangeDraft.from ?? ""}
                            onChange={(event) => updateRangeDraft(plan.path, { from: event.target.value })}
                            placeholder="1"
                          />
                        </label>
                        <label>
                          To
                          <input
                            value={rangeDraft.to ?? ""}
                            onChange={(event) => updateRangeDraft(plan.path, { to: event.target.value })}
                            placeholder={String(plan.steps.length)}
                          />
                        </label>
                        <button
                          className="ghost"
                          onClick={() => {
                            const parsed = parseRangeDraft(plan.path, plan.steps.length);
                            if (parsed.error) {
                              showToast(parsed.error);
                              return;
                            }
                            const payload = buildInputsPayload(plan.path);
                            if (payload.errors.length > 0) {
                              updateInputsDraft(plan.path, { errors: payload.errors });
                              showToast(payload.errors.join("; "));
                              return;
                            }
                            void runPlan(plan.path, parsed.range, { inputs: payload.inputs });
                          }}
                        >
                          Run range
                        </button>
                      </div>
                      <div className="actions">
                        <button className="ghost" onClick={() => selectPlan(plan.path)}>
                          View plan
                        </button>
                        <button
                          className="primary"
                          onClick={() => {
                            if (selectedSteps.length === 0) {
                              showToast("Select at least one step");
                              return;
                            }
                            void runPlan(plan.path, undefined, { selectedSteps });
                          }}
                        >
                          Run selected steps
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {selectedPlan && (
              <div className="modal-backdrop" onClick={clearSelectedPlan}>
                <div className="modal" onClick={(event) => event.stopPropagation()}>
                  <PlanDetail
                    plan={selectedPlan}
                    selectedSteps={getSelectedSteps(selectedPlan.path)}
                    selections={stepSelections[selectedPlan.path] || {}}
                    inputsDraft={inputsDrafts[selectedPlan.path]}
                    onClose={clearSelectedPlan}
                    onToggleStep={(stepIndex) => toggleStepSelection(selectedPlan.path, stepIndex)}
                    onToggleAllSteps={() => toggleAllSteps(selectedPlan.path, selectedPlan.steps)}
                    onInputsChange={(patch) => updateInputsDraft(selectedPlan.path, patch)}
                    onRun={async () => {
                      const selectedSteps = getSelectedSteps(selectedPlan.path);
                      if (selectedSteps.length === 0) {
                        showToast("Select at least one step");
                        return;
                      }
                      const payload = buildInputsPayload(selectedPlan.path);
                      if (payload.errors.length > 0) {
                        updateInputsDraft(selectedPlan.path, { errors: payload.errors });
                        showToast(payload.errors.join("; "));
                        return;
                      }
                      await runPlan(selectedPlan.path, undefined, {
                        selectedSteps,
                        inputs: payload.inputs
                      });
                    }}
                    onReset={() => resetInputs(selectedPlan.path)}
                    formatStepDetails={formatStepDetails}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "executions" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Executions</h2>
                <p>Live status for running plans.</p>
              </div>
              <button className="primary" onClick={() => setTab("runs")}>
                View runs
              </button>
            </div>
            {!hasExecutions && <div className="empty">No executions yet</div>}
            {hasExecutions && (
              <div className="stack">
                {Object.values(executions).map((execution) => (
                  <article className="card" key={execution.executionId}>
                    <div className="card-header">
                      <div>
                        <h3>{execution.planPath}</h3>
                        <p className="muted">ID {execution.executionId}</p>
                      </div>
                      <span className={`pill ${execution.status}`}>{execution.status}</span>
                    </div>
                    <div className="meta">
                      {execution.startedAt && <span>Started: {formatDate(execution.startedAt)}</span>}
                      {execution.finishedAt && <span>Finished: {formatDate(execution.finishedAt)}</span>}
                      {(execution.fromStep || execution.toStep) && (
                        <span>
                          Range {execution.fromStep ?? 1} - {execution.toStep ?? "?"}
                        </span>
                      )}
                      {execution.selectedSteps && execution.selectedSteps.length > 0 && (
                        <span>Selected: {execution.selectedSteps.join(", ")}</span>
                      )}
                    </div>
                    <div className="log-filters">
                      <input
                        placeholder="Filter logs..."
                        value={logFilters[execution.executionId]?.text ?? ""}
                        onChange={(event) =>
                          setLogFilters((current) => ({
                            ...current,
                            [execution.executionId]: {
                              level: current[execution.executionId]?.level ?? "all",
                              text: event.target.value
                            }
                          }))
                        }
                      />
                      <select
                        value={logFilters[execution.executionId]?.level ?? "all"}
                        onChange={(event) =>
                          setLogFilters((current) => ({
                            ...current,
                            [execution.executionId]: {
                              text: current[execution.executionId]?.text ?? "",
                              level: event.target.value as "all" | "error"
                            }
                          }))
                        }
                      >
                        <option value="all">All</option>
                        <option value="error">Errors</option>
                      </select>
                    </div>
                    <div className="actions">
                      <button
                        className="danger"
                        onClick={() => stopExecution(execution.executionId)}
                        disabled={execution.status !== "running"}
                      >
                        Stop
                      </button>
                    </div>
                    {execution.output && execution.output.length > 0 && (
                      <div className="output-groups">
                        {renderExecutionOutput(
                          execution.output,
                          logFilters[execution.executionId]?.text ?? "",
                          logFilters[execution.executionId]?.level ?? "all"
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "runs" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Runs</h2>
                <p>Recent runs and cached executions.</p>
              </div>
              <button className="primary" onClick={() => loadRuns(runsPage, runsPageSize)}>
                Refresh
              </button>
            </div>
            {runsLoading ? (
              <div className="empty">Loading runs...</div>
            ) : runs.length === 0 ? (
              <div className="empty">No runs yet</div>
            ) : (
              <div className="stack">
                {runs.map((run) => (
                  <article className="card" key={run.runId}>
                    <div className="card-header">
                      <div>
                        <h3>{run.feature || run.runId}</h3>
                        <p className="muted">Run {run.runId}</p>
                      </div>
                      <span className={`pill ${run.status?.toLowerCase() || ""}`}>{run.status || "UNKNOWN"}</span>
                    </div>
                    <div className="meta">
                      {run.ticket && <span>Ticket: {run.ticket}</span>}
                      {run.env && <span>Env: {run.env}</span>}
                      {run.startedAt && <span>Started: {formatDate(run.startedAt)}</span>}
                      {run.finishedAt && <span>Finished: {formatDate(run.finishedAt)}</span>}
                    </div>
                    {run.counts && (
                      <div className="meta">
                        <span>Steps: {run.steps}</span>
                        <span>OK: {run.counts.OK}</span>
                        <span>FAIL: {run.counts.FAIL}</span>
                        <span>SKIP: {run.counts.SKIPPED}</span>
                        {run.cacheHits ? <span>Cache hits: {run.cacheHits}</span> : null}
                      </div>
                    )}
                    {run.selectedSteps && run.selectedSteps.length > 0 && (
                      <div className="meta">
                        <span>Selected steps: {run.selectedSteps.join(", ")}</span>
                      </div>
                    )}
                      <div className="actions">
                        <a className="ghost" href={`/runs/${run.runId}/index.html`}>
                          Open
                        </a>
                        {run.planPath && (
                          <button
                            className="primary"
                          onClick={() =>
                            runPlan(
                              run.planPath || "",
                              {
                                fromStep: run.fromStep || undefined,
                                toStep: run.toStep || undefined
                              },
                              {
                                selectedSteps: run.selectedSteps || undefined
                              }
                            )
                            }
                          >
                            Run again
                          </button>
                        )}
                        <button className="danger" onClick={() => deleteRun(run.runId)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            <div className="pagination">
              <button
                className="ghost"
                onClick={() => setRunsPage(Math.max(1, runsPage - 1))}
                disabled={runsPage <= 1}
              >
                Previous
              </button>
              <span>Page {runsPage} of {totalPages}</span>
              <button
                className="ghost"
                onClick={() => setRunsPage(Math.min(totalPages, runsPage + 1))}
                disabled={runsPage >= totalPages}
              >
                Next
              </button>
            </div>
          </section>
        )}

        {tab === "reports" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Reports</h2>
                <p>Monte um documento com evidencias selecionadas.</p>
              </div>
              <button className="primary" onClick={() => loadReportRuns()} disabled={reportRunsLoading}>
                {reportRunsLoading ? "Loading..." : "Refresh runs"}
              </button>
            </div>
            <div className="report-builder">
              <div className="card report-panel">
                <div className="report-controls">
                  <label>
                    Report name
                    <input
                      value={reportName}
                      onChange={(event) => setReportName(event.target.value)}
                      placeholder="relatorio"
                    />
                  </label>
                  <div className="report-inline-actions">
                    <button
                      className="ghost"
                      onClick={() => reportRunId && loadRunDetails(reportRunId)}
                      disabled={!reportRunId}
                    >
                      Reload run
                    </button>
                    <button className="primary" onClick={generateReport} disabled={!reportRunId}>
                      Generate docx
                    </button>
                  </div>
                </div>
                <div className="report-actions">
                  <button className="ghost" onClick={() => addReportBlock("h1")}>Add H1</button>
                  <button className="ghost" onClick={() => addReportBlock("h2")}>Add H2</button>
                  <button className="ghost" onClick={() => addReportBlock("p")}>Add P</button>
                  <button className="ghost" onClick={() => addReportBlock("small")}>Add Small</button>
                  <button className="ghost" onClick={() => addReportBlock("evidence")}>Add evidence</button>
                </div>
                {reportLinks && (
                  <div className="report-links">
                    {reportLinks.docxUrl && (
                      <a className="ghost" href={reportLinks.docxUrl}>Download docx</a>
                    )}
                    {reportLinks.htmlUrl && (
                      <a className="ghost" href={reportLinks.htmlUrl} target="_blank" rel="noreferrer">
                        Open HTML
                      </a>
                    )}
                    {reportLinks.jsonUrl && (
                      <a className="ghost" href={reportLinks.jsonUrl} target="_blank" rel="noreferrer">
                        Open JSON
                      </a>
                    )}
                  </div>
                )}
                {reportBlocks.length === 0 ? (
                  <div className="empty">Add blocks to start assembling the report.</div>
                ) : (
                  <div className="report-blocks">
                    {reportBlocks.map((block, index) => {
                      return (
                        <div className={`report-block ${block.enabled === false ? "disabled" : ""}`} key={block.id}>
                          <div className="report-block-header">
                            <div className="report-block-title">
                              <span className="pill secondary">{block.type}</span>
                              <span className="muted">#{index + 1}</span>
                            </div>
                            <div className="report-block-actions">
                              <button className="ghost" onClick={() => moveReportBlock(block.id, -1)}>Up</button>
                              <button className="ghost" onClick={() => moveReportBlock(block.id, 1)}>Down</button>
                              <button
                                className="ghost"
                                onClick={() => updateReportBlock(block.id, { enabled: block.enabled === false })}
                              >
                                {block.enabled === false ? "Include" : "Skip"}
                              </button>
                              <button className="danger" onClick={() => removeReportBlock(block.id)}>Remove</button>
                            </div>
                          </div>
                          <div className="report-block-body">
                            {(block.type === "h1" || block.type === "h2" || block.type === "p" || block.type === "small") && (
                              <textarea
                                rows={block.type === "p" ? 4 : 2}
                                placeholder="Write text..."
                                value={block.text ?? ""}
                                onChange={(event) => updateReportBlock(block.id, { text: event.target.value })}
                              />
                            )}
                            {block.type === "evidence" && (
                              <div className="report-evidence-form">
                                <label>
                                  Label
                                  <input
                                    value={block.label ?? ""}
                                    onChange={(event) => updateReportBlock(block.id, { label: event.target.value })}
                                  />
                                </label>
                                <label>
                                  Caption
                                  <input
                                    value={block.caption ?? ""}
                                    onChange={(event) => updateReportBlock(block.id, { caption: event.target.value })}
                                  />
                                </label>
                                <div className="report-evidence-row">
                                  <div className="report-evidence-summary">
                                    <span className="muted">
                                      {block.stepId && block.filename
                                        ? `${block.runId || reportRunId} / ${block.stepId} → ${block.filename}`
                                        : "No evidence selected"}
                                    </span>
                                  </div>
                                  <button className="ghost" onClick={() => openEvidencePicker(block.id)}>
                                    Choose evidence
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="card report-preview">
                <div className="report-preview-header">
                  <h3>Preview</h3>
                  <span className="muted">
                    {reportRunId ? `Run ${reportRunId}` : "Select a run to load evidences"}
                  </span>
                </div>
            <div className="report-preview-body">
              {reportBlocks
                .filter((block) => block.enabled !== false)
                .map((block) => {
                  if (block.type === "h1") {
                    return <h1 key={block.id}>{block.text || "Untitled h1"}</h1>;
                  }
                  if (block.type === "h2") {
                    return <h2 key={block.id}>{block.text || "Untitled h2"}</h2>;
                  }
                  if (block.type === "p") {
                    return <p key={block.id}>{block.text || "..."}</p>;
                  }
                  if (block.type === "small") {
                    return <small key={block.id}>{block.text || "..."}</small>;
                  }
                      if (block.type === "evidence") {
                        const artifact = getRunArtifact(
                          reportDetailsByRun,
                          block.runId || reportRunId,
                          block.stepId,
                          block.filename
                        );
                        return (
                          <div className="report-evidence" key={block.id}>
                            <strong>{block.label || "Evidence"}</strong>
                            {artifact ? (
                              <>
                                {artifact.kind === "image" && (
                                  <img src={artifact.url} alt={artifact.filename} />
                                )}
                                {artifact.kind === "html" && (
                                  <iframe title={artifact.filename} src={artifact.url} />
                                )}
                                {artifact.kind === "file" && (
                                  <span className="muted">{artifact.filename}</span>
                                )}
                              </>
                            ) : (
                              <p className="muted">No evidence selected.</p>
                            )}
                            {block.caption && <p className="muted">{block.caption}</p>}
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "triggers" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Triggers</h2>
                <p>Create and manage trigger status.</p>
              </div>
              <button className="primary" onClick={() => loadTriggers()} disabled={triggersLoading}>
                {triggersLoading ? "Loading..." : "Refresh"}
              </button>
            </div>
            <form className="form" onSubmit={createTrigger} data-testid="trigger-form">
              <input
                data-testid="trigger-name"
                placeholder="Trigger name"
                value={triggerForm.name}
                onChange={(event) => setTriggerForm({ ...triggerForm, name: event.target.value })}
              />
              <input
                data-testid="trigger-provider"
                placeholder="Provider"
                value={triggerForm.provider}
                onChange={(event) => setTriggerForm({ ...triggerForm, provider: event.target.value })}
              />
              <input
                data-testid="trigger-target"
                placeholder="Target"
                value={triggerForm.target}
                onChange={(event) => setTriggerForm({ ...triggerForm, target: event.target.value })}
              />
              <input
                data-testid="trigger-logs"
                placeholder="Logs URL"
                value={triggerForm.logsUrl}
                onChange={(event) => setTriggerForm({ ...triggerForm, logsUrl: event.target.value })}
              />
              <button className="primary" type="submit">Create</button>
            </form>
            {triggersLoading ? (
              <div className="empty">Loading triggers...</div>
            ) : triggers.length === 0 ? (
              <div className="empty">No triggers configured</div>
            ) : (
              <div className="stack" data-testid="triggers-list">
                {triggers.map((trigger) => (
                  <article className="card" data-testid="trigger-card" key={trigger.id}>
                    <div className="card-header">
                      <div>
                        <h3>{trigger.name}</h3>
                        <p className="muted">{trigger.provider} {trigger.target}</p>
                      </div>
                      <span className={`pill ${trigger.status}`}>{trigger.status}</span>
                    </div>
                    <div className="meta">
                      <span>Created: {formatDate(trigger.createdAt)}</span>
                      <span>Updated: {formatDate(trigger.updatedAt)}</span>
                      {trigger.lastMessage && <span>Last: {trigger.lastMessage}</span>}
                    </div>
                    <div className="actions">
                      {trigger.logsUrl && (
                        <a className="ghost" href={trigger.logsUrl} target="_blank" rel="noreferrer">
                          Logs
                        </a>
                      )}
                      <button className="ghost" onClick={() => updateTrigger(trigger.id, { status: "observing" })}>
                        Start
                      </button>
                      <button className="ghost" onClick={() => updateTrigger(trigger.id, { status: "stopped" })}>
                        Stop
                      </button>
                      <button className="ghost" onClick={() => updateTrigger(trigger.id, { status: "success" })}>
                        Success
                      </button>
                      <button className="ghost" onClick={() => updateTrigger(trigger.id, { status: "error" })}>
                        Error
                      </button>
                      <button className="danger" onClick={() => deleteTrigger(trigger.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.tone || "info"}`}>
          <span>{toast.message}</span>
          <button className="ghost" onClick={() => setToast(null)}>Close</button>
        </div>
      )}

      {evidencePicker.open && (
        <div className="modal-backdrop" onClick={closeEvidencePicker}>
          <div className="modal report-evidence-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose evidence</h3>
              <button className="ghost" onClick={closeEvidencePicker}>Close</button>
            </div>
            <div className="report-evidence-modal-body">
              <div className="report-evidence-selectors">
                <label>
                  Evidence
                  <input
                    className="report-evidence-search"
                    placeholder="Search by run, step, filename..."
                    value={evidenceSearch}
                    onChange={(event) => setEvidenceSearch(event.target.value)}
                  />
                  <select
                    data-testid="report-modal-evidence"
                    value={
                      evidencePicker.runId && evidencePicker.stepId && evidencePicker.filename
                        ? `${evidencePicker.runId}::${evidencePicker.stepId}::${evidencePicker.filename}`
                        : ""
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) {
                        setEvidencePicker((current) => ({
                          ...current,
                          runId: "",
                          stepId: "",
                          filename: ""
                        }));
                        return;
                      }
                      const [runId, stepId, filename] = value.split("::");
                      setEvidencePicker((current) => ({
                        ...current,
                        runId,
                        stepId,
                        filename
                      }));
                    }}
                  >
                    <option value="">Select evidence</option>
                    {getEvidenceOptions(reportRuns, reportDetailsByRun, evidenceSearch).map((item) => (
                      <option key={item.key} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="report-evidence-preview">
                {(() => {
                  const artifact = getRunArtifact(
                    reportDetailsByRun,
                    evidencePicker.runId,
                    evidencePicker.stepId,
                    evidencePicker.filename
                  );
                  if (!artifact) {
                    return <p className="muted">Select a step and evidence to preview.</p>;
                  }
                  if (artifact.kind === "image") {
                    return <img src={artifact.url} alt={artifact.filename} />;
                  }
                  if (artifact.kind === "html") {
                    return <iframe title={artifact.filename} src={artifact.url} />;
                  }
                  return (
                    <a className="ghost" href={artifact.url} target="_blank" rel="noreferrer">
                      Open {artifact.filename}
                    </a>
                  );
                })()}
              </div>
            </div>
            <div className="report-evidence-modal-actions">
              <button className="ghost" onClick={closeEvidencePicker}>Cancel</button>
              <button
                className="primary"
                data-testid="report-modal-confirm"
                onClick={confirmEvidencePicker}
                disabled={!evidencePicker.filename}
              >
                Confirm evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatInputsConfig(config: PlanConfig) {
  const parts = [] as string[];
  if (config.envPrefix) parts.push(`env ${config.envPrefix}`);
  parts.push(`defaults ${config.defaultsCount}`);
  parts.push(`overrides ${config.overridesCount}`);
  parts.push(`items ${config.itemsCount}`);
  return parts.join(", ");
}

function formatBrowserConfig(config: PlanConfig) {
  const parts = [] as string[];
  parts.push(config.reuseSession ? "reuse" : "no reuse");
  if (config.headless !== null) parts.push(config.headless ? "headless" : "headed");
  if (config.channel) parts.push(config.channel);
  return parts.length > 0 ? parts.join(", ") : "default";
}

function formatAssetsConfig(config: PlanConfig) {
  const parts = [] as string[];
  if (config.behaviorsPath) parts.push(`behaviors ${truncatePath(config.behaviorsPath)}`);
  if (config.curlPath) parts.push(`curl ${truncatePath(config.curlPath)}`);
  return parts.length > 0 ? parts.join(", ") : "none";
}

function truncatePath(value: string) {
  if (!value) return "";
  const normalized = value.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1];
}

function getPlanFromHash() {
  if (!window.location.hash) return "";
  const match = window.location.hash.match(/plan=([^&]+)/);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

function filterPlans(plans: Plan[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return plans;
  return plans.filter((plan) => {
    const haystack = [
      plan.feature,
      plan.path,
      plan.ticket,
      plan.env
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

function formatStepDetails(step: PlanStep) {
  if (!step.details) return "";
  if (step.type === "api") {
    const method = step.details.method as string | undefined;
    const url = step.details.url as string | undefined;
    return method && url ? `${method} ${url}` : "API request";
  }
  if (step.type === "browser") {
    const behaviorId = step.details.behaviorId as string | undefined;
    const actionsCount = step.details.actionsCount as number | undefined;
    const types = Array.isArray(step.details.actions)
      ? (step.details.actions as Array<{ type?: string }>).map((action) => action.type).filter(Boolean)
      : [];
    const parts = [
      behaviorId ? `behavior: ${behaviorId}` : "browser actions",
      actionsCount ? `actions: ${actionsCount}` : "",
      types.length > 0 ? `types: ${types.join(", ")}` : ""
    ].filter(Boolean);
    return parts.join(" | ");
  }
  if (step.type === "sqlEvidence") {
    const adapter = step.details.adapter as string | undefined;
    const queryPath = step.details.queryPath as string | undefined;
    const query = step.details.query as string | undefined;
    const expectRows = step.details.expectRows as number | undefined;
    const source = queryPath ? `query: ${queryPath}` : query ? "inline query" : "";
    const parts = [adapter ? `adapter: ${adapter}` : "", source, expectRows !== undefined ? `expect: ${expectRows}` : ""].filter(Boolean);
    return parts.join(" | ");
  }
  if (step.type === "cli") {
    const command = step.details.command as string | undefined;
    const args = Array.isArray(step.details.args) ? (step.details.args as string[]) : [];
    const cwd = step.details.cwd as string | undefined;
    const parts = [
      command ? `cmd: ${command}` : "cli",
      args.length > 0 ? `args: ${args.join(" ")}` : "",
      cwd ? `cwd: ${cwd}` : ""
    ].filter(Boolean);
    return parts.join(" | ");
  }
  if (step.type === "specialist") {
    const task = step.details.task as string | undefined;
    const outputPath = step.details.outputPath as string | undefined;
    const parts = [task ? `task: ${task}` : "specialist", outputPath ? `out: ${outputPath}` : ""].filter(Boolean);
    return parts.join(" | ");
  }
  if (step.type === "logstream") {
    const url = step.details.url as string | undefined;
    const title = step.details.title as string | undefined;
    const parts = [title ? `title: ${title}` : "logstream", url ? `url: ${url}` : ""].filter(Boolean);
    return parts.join(" | ");
  }
  return "";
}

function validateInputRows(rows: Array<{ key: string; value: string }>, label: string) {
  const errors: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row, idx) => {
    const key = row.key.trim();
    const value = row.value.trim();
    if (!key && value) {
      errors.push(`${label} row ${idx + 1}: key is required`);
      return;
    }
    if (!key) {
      return;
    }
    const normalized = key.toLowerCase();
    if (seen.has(normalized)) {
      errors.push(`${label} row ${idx + 1}: duplicate key "${key}"`);
    }
    seen.add(normalized);
  });
  return errors;
}

function getRunDetails(detailsMap: Record<string, RunDetails>, runId?: string) {
  if (!runId) {
    return null;
  }
  return detailsMap[runId] ?? null;
}

function getRunStep(details: RunDetails | null, stepId?: string) {
  if (!details || !stepId) {
    return null;
  }
  return details.steps.find((step) => step.id === stepId) ?? null;
}

function getRunArtifact(
  detailsMap: Record<string, RunDetails>,
  runId?: string,
  stepId?: string,
  filename?: string
) {
  const details = getRunDetails(detailsMap, runId);
  if (!details || !stepId || !filename) {
    return null;
  }
  const step = getRunStep(details, stepId);
  if (!step) {
    return null;
  }
  return step.artifacts.find((artifact) => artifact.filename === filename) ?? null;
}

function getEvidenceOptions(
  runs: RunSummary[],
  detailsMap: Record<string, RunDetails>,
  search: string
) {
  const normalized = search.trim().toLowerCase();
  const sortedRuns = [...runs].sort((a, b) => b.runId.localeCompare(a.runId));
  const options: Array<{ key: string; value: string; label: string }> = [];
  for (const run of sortedRuns) {
    const details = getRunDetails(detailsMap, run.runId);
    const steps = details?.steps ?? [];
    for (const step of steps) {
      for (const artifact of step.artifacts) {
        const label = `${run.runId} / ${step.id} / ${artifact.label}:${artifact.filename}`;
        if (normalized && !label.toLowerCase().includes(normalized)) {
          continue;
        }
        options.push({
          key: `${run.runId}-${step.id}-${artifact.filename}`,
          value: `${run.runId}::${step.id}::${artifact.filename}`,
          label
        });
      }
    }
  }
  return options;
}

function getStepTypeCounts(steps: PlanStep[]) {
  const counts = new Map<string, number>();
  for (const step of steps) {
    counts.set(step.type, (counts.get(step.type) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
}

function getPlanFlags(plan: Plan) {
  if (!plan.config) return [];
  const flags: string[] = [];
  if (plan.config.cacheEnabled) flags.push("cache");
  if (plan.config.envPrefix) flags.push(`env ${plan.config.envPrefix}`);
  if (plan.config.reuseSession) flags.push("reuse session");
  if (plan.config.failPolicy && plan.config.failPolicy !== "stop") {
    flags.push(`fail ${plan.config.failPolicy}`);
  }
  return flags;
}

function renderExecutionOutput(output: string[], filterText: string, level: "all" | "error") {
  const lines = output.join("").split(/\r?\n/);
  const filteredLines = filterExecutionLines(lines, filterText, level);
  const groups = groupOutputByStep(filteredLines);
  if (groups.length === 0) {
    return <div className="output">No output yet</div>;
  }
  return groups.map((group) => (
    <div className="output-group" key={group.title}>
      <div className={`output-header ${group.statusClass}`}>
        <span>{group.title}</span>
        <span className="output-meta">
          {group.cacheHit ? <span className="cache-pill">cache</span> : null}
          {typeof group.attempts === "number" ? (
            <span className="attempts-pill">attempts {group.attempts}</span>
          ) : null}
          {group.errorCount ? <span className="error-pill">errors {group.errorCount}</span> : null}
          {formatGroupStatus(group)}
        </span>
      </div>
      <pre className="output">{group.lines.join("\n")}</pre>
    </div>
  ));
}

function filterExecutionLines(lines: string[], filterText: string, level: "all" | "error") {
  const normalizedText = filterText.trim().toLowerCase();
  return lines.filter((line) => {
    if (!line) {
      return false;
    }
    if (level === "error") {
      const errorHit = line.includes("ERROR") || line.includes(" FAIL");
      if (!errorHit) {
        return false;
      }
    }
    if (normalizedText) {
      return line.toLowerCase().includes(normalizedText);
    }
    return true;
  });
}

function groupOutputByStep(lines: string[]) {
  const groups: Array<{
    title: string;
    lines: string[];
    statusLabel: string;
    statusClass: string;
    durationMs?: number;
    cacheHit?: boolean;
    attempts?: number;
    errorCount?: number;
  }> = [];
  let current = createGroup("General logs");
  for (const line of lines) {
    if (!line) continue;
    const match = line.match(/Step\s+(\d{2})\/(\d+)\s+(.+)/);
    if (match) {
      if (current.lines.length > 0) groups.push(current);
      current = createGroup(`Step ${match[1]}: ${match[3]}`);
    }
    current.lines.push(line);
    updateGroupStatus(current, line);
  }
  if (current.lines.length > 0) groups.push(current);
  return groups;
}

function createGroup(title: string) {
  return {
    title,
    lines: [] as string[],
    statusLabel: "RUNNING",
    statusClass: "running",
    cacheHit: false,
    attempts: undefined,
    errorCount: 0
  };
}

function updateGroupStatus(
  group: {
    statusLabel: string;
    statusClass: string;
    durationMs?: number;
    cacheHit?: boolean;
    attempts?: number;
    errorCount?: number;
  },
  line: string
) {
  if (!/\bStep\s+\d{2}\/\d+/.test(line)) {
    return;
  }
  if (line.includes(" OK")) {
    group.statusLabel = "OK";
    group.statusClass = "ok";
  }
  if (line.includes(" FAIL")) {
    group.statusLabel = "FAIL";
    group.statusClass = "fail";
  }
  if (line.includes(" SKIPPED")) {
    group.statusLabel = "SKIPPED";
    group.statusClass = "skipped";
  }
  if (line.toLowerCase().includes("cache")) {
    group.cacheHit = true;
  }
  if (line.toLowerCase().includes("error")) {
    group.errorCount = (group.errorCount ?? 0) + 1;
  }
  const attemptMatch = line.match(/attempts=(\d+)/);
  if (attemptMatch) {
    group.attempts = Number.parseInt(attemptMatch[1], 10);
  }
  const durationMatch = line.match(/durationMs=(\d+)/);
  if (durationMatch) {
    group.durationMs = Number.parseInt(durationMatch[1], 10);
  }
}

function formatGroupStatus(group: { statusLabel: string; durationMs?: number }) {
  if (typeof group.durationMs === "number") {
    return `${group.statusLabel} (${group.durationMs}ms)`;
  }
  return group.statusLabel;
}
