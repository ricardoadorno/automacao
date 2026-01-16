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
  Range,
  RunSummary,
  Trigger
} from "./types";

type TabKey = "plans" | "examples" | "executions" | "runs" | "triggers";

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
  const [triggerForm, setTriggerForm] = useState({
    name: "",
    provider: "eventbridge",
    target: "",
    logsUrl: ""
  });
  const pollersRef = useRef<Record<string, number>>({});

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
    if (tab === "triggers") {
      void loadTriggers();
    }
  }, [tab, runsPage, runsPageSize]);

  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach((id) => clearInterval(id));
      pollersRef.current = {};
    };
  }, []);

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

  function buildInputsPayload(planPath: string) {
    const draft = inputsDrafts[planPath];
    if (!draft) return { inputs: undefined, errors: [] as string[] };
    const defaults = rowsToObject(draft.defaultsRows);
    const overrides = rowsToObject(draft.overridesRows);
    const items = parseItemsRows(draft.itemsRows);
    const errors = items.errors;
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
          <button className="ghost" onClick={() => setTab("triggers")}>Triggers</button>
        </div>
      </header>

      <main className="content">
        <nav className="tabs">
          {["plans", "examples", "executions", "runs", "triggers"].map((key) => (
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
                    {execution.output && execution.output.length > 0 && (
                      <div className="output-groups">
                        {renderExecutionOutput(execution.output)}
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
  return "";
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

function renderExecutionOutput(output: string[]) {
  const lines = output.join("").split(/\r?\n/);
  const groups = groupOutputByStep(lines);
  if (groups.length === 0) {
    return <div className="output">No output yet</div>;
  }
  return groups.map((group) => (
    <div className="output-group" key={group.title}>
      <div className={`output-header ${group.statusClass}`}>
        <span>{group.title}</span>
        <span>{group.statusLabel}</span>
      </div>
      <pre className="output">{group.lines.join("\n")}</pre>
    </div>
  ));
}

function groupOutputByStep(lines: string[]) {
  const groups: Array<{ title: string; lines: string[]; statusLabel: string; statusClass: string }> = [];
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
  return { title, lines: [] as string[], statusLabel: "RUNNING", statusClass: "running" };
}

function updateGroupStatus(
  group: { statusLabel: string; statusClass: string },
  line: string
) {
  if (line.includes(" OK")) {
    group.statusLabel = "OK";
    group.statusClass = "ok";
  }
  if (line.includes(" FAIL")) {
    group.statusLabel = "FAIL";
    group.statusClass = "fail";
  }
}
