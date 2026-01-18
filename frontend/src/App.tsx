import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Clock, FlaskConical, FolderOpen, LoaderCircle, Search, Timer } from "lucide-react";
import { PlanDetail } from "./components/PlanDetail";
import { ReportsPanel } from "./components/ReportsPanel";
import { AppShell, Button, Sidebar, Topbar } from "./design-system";
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
  SavedReport,
  RunDetails,
  RunSummary,
  Trigger
} from "./types";

type TabKey = "plans" | "examples" | "executions" | "runs" | "reports" | "triggers";

type ToastTone = "success" | "error" | "info" | "warning";
type Toast = {
  title: string;
  message: string;
  tone: ToastTone;
  durationMs: number;
} | null;

const tabPaths: Record<TabKey, string> = {
  plans: "/plans",
  examples: "/examples",
  executions: "/executions",
  runs: "/runs",
  reports: "/reports",
  triggers: "/triggers"
};

function tabFromPath(pathname: string): TabKey {
  const entries = Object.entries(tabPaths) as Array<[TabKey, string]>;
  const aliases: Partial<Record<TabKey, string[]>> = {
    executions: ["/execucoes"]
  };
  const match = entries.find(([key, path]) => {
    if (pathname.startsWith(path)) return true;
    const extra = aliases[key];
    return extra ? extra.some((alias) => pathname.startsWith(alias)) : false;
  });
  return match ? match[0] : "plans";
}

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
  const location = useLocation();
  const navigate = useNavigate();
  const tab = useMemo(() => tabFromPath(location.pathname), [location.pathname]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [examples, setExamples] = useState<Plan[]>([]);
  const [examplesLoading, setExamplesLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState("");
  const [exampleFilter, setExampleFilter] = useState("");
  const [stepSelections, setStepSelections] = useState<Record<string, Record<number, boolean>>>({});
  const [collapsedPlanCards, setCollapsedPlanCards] = useState<Record<string, boolean>>({});
  const [collapsedOutputGroups, setCollapsedOutputGroups] = useState<Record<string, Record<string, boolean>>>({});
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
  const [reportLibrary, setReportLibrary] = useState<SavedReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [evidencePicker, setEvidencePicker] = useState<{
    open: boolean;
    blockId?: string;
    runId?: string;
    stepId?: string;
    filename?: string;
  }>({ open: false });
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [logFilters, setLogFilters] = useState<Record<string, { level: "all" | "error" }>>({});
  const [minimizedExecutions, setMinimizedExecutions] = useState<Record<string, boolean>>({});
  const [stepsMinimized, setStepsMinimized] = useState<Record<string, boolean>>({});
  const [executionRerunDrafts, setExecutionRerunDrafts] = useState<Record<string, { steps: string; from: string; to: string }>>({});
  const [runRerunDrafts, setRunRerunDrafts] = useState<Record<string, { steps: string; from: string; to: string }>>({});
  const [runStepsExpanded, setRunStepsExpanded] = useState<Record<string, boolean>>({});
  const [triggerForm, setTriggerForm] = useState({
    name: "",
    provider: "eventbridge",
    target: "",
    logsUrl: ""
  });
  const pollersRef = useRef<Record<string, number>>({});
  const streamRefs = useRef<Record<string, EventSource>>({});
  const triggersPollerRef = useRef<number | null>(null);

  const hasExecutions = useMemo(() => Object.keys(executions).length > 0, [executions]);
  const canGenerateReport = useMemo(
    () => Boolean(getReportBaseRunId(reportBlocks, reportRunId)),
    [reportBlocks, reportRunId]
  );

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
    if (location.pathname === "/") {
      navigate(tabPaths.plans, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach((id) => clearInterval(id));
      pollersRef.current = {};
      Object.values(streamRefs.current).forEach((source) => source.close());
      streamRefs.current = {};
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
    try {
      const raw = localStorage.getItem("automacao-report-library");
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedReport[];
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            id: String(item.id || `report-${Date.now()}`),
            name: String(item.name || "relatorio"),
            runId: String(item.runId || ""),
            blocks: Array.isArray(item.blocks) ? item.blocks : [],
            createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
            updatedAt: item.updatedAt ? String(item.updatedAt) : new Date().toISOString(),
            exports: item.exports
              ? {
                  jsonUrl: item.exports.jsonUrl,
                  htmlUrl: item.exports.htmlUrl,
                  docxUrl: item.exports.docxUrl,
                  generatedAt: item.exports.generatedAt
                }
              : undefined
          }));
        setReportLibrary(normalized);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("automacao-report-draft");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { name?: string; runId?: string; blocks?: ReportBlock[] };
      if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        setReportName(String(parsed.name || "relatorio"));
        if (parsed.runId) {
          setReportRunId(String(parsed.runId));
        }
        setReportBlocks(parsed.blocks);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "automacao-report-draft",
        JSON.stringify({ name: reportName, runId: reportRunId, blocks: reportBlocks })
      );
    } catch {
      // ignore
    }
  }, [reportName, reportRunId, reportBlocks]);

  useEffect(() => {
    try {
      localStorage.setItem("automacao-report-library", JSON.stringify(reportLibrary));
    } catch {
      // ignore
    }
  }, [reportLibrary]);

  useEffect(() => {
    if (!reportRunId) {
      setReportDetails(null);
      return;
    }
    void loadRunDetails(reportRunId, { setActive: true });
    if (!activeReportId) {
      setReportLinks(null);
    }
  }, [reportRunId, activeReportId]);

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
      resumeFrom?: string;
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
      if (options.resumeFrom) {
        payload.resumeFrom = options.resumeFrom;
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
        toStep: data.toStep,
        resumeFrom: options.resumeFrom ?? null
      };
      setExecutions((current) => ({ ...current, [execution.executionId]: execution }));
      showToast({ message: "Execution started", tone: "success" });
      clearSelectedPlan();
      setSidebarOpen(false);
      goToTab("executions");
      startPolling(execution.executionId);
      startStream(execution.executionId);
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

  function startStream(executionId: string) {
    if (streamRefs.current[executionId] || typeof EventSource === "undefined") {
      return;
    }
    const source = new EventSource(`/api/execution-stream?id=${encodeURIComponent(executionId)}`);
    streamRefs.current[executionId] = source;
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type: string; text?: string; status?: string };
        if (payload.type === "log" && payload.text) {
          setExecutions((current) => {
            const existing = current[executionId];
            if (!existing) {
              return current;
            }
            const output = existing.output ? [...existing.output, payload.text] : [payload.text];
            return { ...current, [executionId]: { ...existing, output } };
          });
        }
        if (payload.type === "end") {
          setExecutions((current) => {
            const existing = current[executionId];
            if (!existing) {
              return current;
            }
            return {
              ...current,
              [executionId]: { ...existing, status: payload.status || existing.status }
            };
          });
          source.close();
          delete streamRefs.current[executionId];
        }
      } catch {
        // ignore malformed events
      }
    };
    source.onerror = () => {
      source.close();
      delete streamRefs.current[executionId];
    };
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
      setToast({
        title: "Erro",
        message: value.message,
        tone: "error",
        durationMs: 7000
      });
      return;
    }
    if (typeof value === "string") {
      setToast({
        title: "Informacao",
        message: value,
        tone: "info",
        durationMs: 5000
      });
      return;
    }
    if (typeof value === "object" && value && "message" in value) {
      const payload = value as {
        title?: string;
        message?: string;
        tone?: ToastTone;
        durationMs?: number;
      };
      const tone = payload.tone ?? "info";
      const title =
        payload.title ??
        (tone === "error" ? "Erro" : tone === "success" ? "Sucesso" : tone === "warning" ? "Aviso" : "Informacao");
      const message = String(payload.message ?? "");
      setToast({
        title,
        message,
        tone,
        durationMs: payload.durationMs ?? (tone === "error" ? 7000 : 5000)
      });
      return;
    }
    setToast({
      title: "Informacao",
      message: "Concluido",
      tone: "info",
      durationMs: 4000
    });
  }

  useEffect(() => {
    if (!toast) return;
    if (toast.durationMs <= 0) return;
    const timerId = window.setTimeout(() => setToast(null), toast.durationMs);
    return () => window.clearTimeout(timerId);
  }, [toast]);

  function goToTab(next: TabKey) {
    navigate(tabPaths[next]);
  }

  function addReportBlock(type: ReportBlock["type"]) {
    const id = `block-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const base: ReportBlock = { id, type, enabled: true };
    if (type === "h1" || type === "h2" || type === "h3" || type === "h4" || type === "p" || type === "small") {
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

  function updateReportLibraryItem(id: string, patch: Partial<SavedReport>) {
    setReportLibrary((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item))
    );
  }

  function saveReportDraft(options: { asNew?: boolean } = {}) {
    const now = new Date().toISOString();
    const name = reportName.trim() || "relatorio";
    const runId = reportRunId;
    const blocks = reportBlocks;
    if (options.asNew || !activeReportId) {
      const id = `report-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const draft: SavedReport = {
        id,
        name,
        runId,
        blocks,
        createdAt: now,
        updatedAt: now
      };
      setReportLibrary((current) => [draft, ...current]);
      setActiveReportId(id);
      showToast({ message: "Report saved", tone: "success" });
      return;
    }
    setReportLibrary((current) =>
      current.map((item) =>
        item.id === activeReportId
          ? {
              ...item,
              name,
              runId,
              blocks,
              updatedAt: now
            }
          : item
      )
    );
    showToast({ message: "Report updated", tone: "success" });
  }

  function loadReportDraft(id: string) {
    const draft = reportLibrary.find((item) => item.id === id);
    if (!draft) {
      showToast("Report not found");
      return;
    }
    setReportName(draft.name);
    setReportBlocks(draft.blocks);
    if (draft.runId) {
      setReportRunId(draft.runId);
    }
    setReportLinks(draft.exports ?? null);
    setActiveReportId(draft.id);
    showToast({ message: "Report loaded", tone: "info" });
  }

  function deleteReportDraft(id: string) {
    if (!window.confirm("Delete this saved report?")) {
      return;
    }
    setReportLibrary((current) => current.filter((item) => item.id !== id));
    if (activeReportId === id) {
      setActiveReportId(null);
    }
    showToast({ message: "Report removed", tone: "success" });
  }

  function startNewReportDraft() {
    setReportName("relatorio");
    setReportBlocks([]);
    setReportLinks(null);
    setActiveReportId(null);
  }

  function buildReportDocumentFromValues(
    name: string | undefined,
    runId: string | undefined,
    blocks: ReportBlock[] | undefined
  ): ReportDocument {
    return {
      name: String(name || "").trim() || "relatorio",
      runId: String(runId || ""),
      blocks: Array.isArray(blocks)
        ? blocks.map((block) => ({
            ...block,
            enabled: block.enabled !== false
          }))
        : []
    };
  }

  function buildReportDocument(): ReportDocument {
    return buildReportDocumentFromValues(reportName, reportRunId, reportBlocks);
  }

  function getReportBaseRunId(blocks: ReportBlock[], runId?: string) {
    if (runId) {
      return runId;
    }
    const firstEvidence = blocks.find((block) => block.type === "evidence" && block.runId);
    return firstEvidence?.runId ?? "";
  }

  async function generateReport(draft?: SavedReport, overrideBlocks?: ReportBlock[]) {
    let report: ReportDocument;
    if (draft) {
      report = buildReportDocumentFromValues(draft.name, draft.runId || reportRunId, draft.blocks);
    } else if (overrideBlocks && overrideBlocks.length > 0) {
      report = buildReportDocumentFromValues(reportName, reportRunId, overrideBlocks);
    } else if (reportBlocks.length === 0 && activeReportId) {
      const fallback = reportLibrary.find((item) => item.id === activeReportId);
      report = buildReportDocumentFromValues(
        fallback?.name ?? reportName,
        fallback?.runId || reportRunId,
        fallback?.blocks ?? reportBlocks
      );
    } else if (reportBlocks.length === 0) {
      const fallback = readDraftFromStorage();
      report = buildReportDocumentFromValues(
        fallback?.name ?? reportName,
        fallback?.runId || reportRunId,
        fallback?.blocks ?? reportBlocks
      );
    } else {
      report = buildReportDocument();
    }
    const baseRunId = getReportBaseRunId(report.blocks, report.runId);
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
      if (draft) {
        updateReportLibraryItem(draft.id, {
          exports: { ...data, generatedAt: new Date().toISOString() }
        });
      } else if (activeReportId) {
        updateReportLibraryItem(activeReportId, {
          exports: { ...data, generatedAt: new Date().toISOString() }
        });
      }
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

  function handleEvidenceSelectionChange(value: { runId: string; stepId: string; filename: string } | null) {
    setEvidencePicker((current) => ({
      ...current,
      runId: value?.runId ?? "",
      stepId: value?.stepId ?? "",
      filename: value?.filename ?? ""
    }));
  }

  function readDraftFromStorage() {
    try {
      const raw = localStorage.getItem("automacao-report-draft");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { name?: string; runId?: string; blocks?: ReportBlock[] };
      if (!parsed || !Array.isArray(parsed.blocks)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function toggleStepSelection(planPath: string, stepIndex: number) {
    setStepSelections((current) => ({
      ...current,
      [planPath]: { ...current[planPath], [stepIndex]: !current[planPath]?.[stepIndex] }
    }));
  }

  function togglePlanCollapse(planPath: string) {
    setCollapsedPlanCards((current) => ({
      ...current,
      [planPath]: !current[planPath]
    }));
  }

  function toggleOutputGroup(executionId: string, groupKey: string) {
    setCollapsedOutputGroups((current) => {
      const existing = current[executionId] || {};
      return {
        ...current,
        [executionId]: {
          ...existing,
          [groupKey]: !existing[groupKey]
        }
      };
    });
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
  const executionList = useMemo(() => {
    return Object.values(executions).sort((a, b) => {
      const aRunning = a.status === "running";
      const bRunning = b.status === "running";
      if (aRunning !== bRunning) return aRunning ? -1 : 1;
      return (b.startedAt || "").localeCompare(a.startedAt || "");
    });
  }, [executions]);
  const focusExecutionId = executionList.find((execution) => execution.status === "running")?.executionId;

  useEffect(() => {
    if (executionList.length === 0) {
      return;
    }
    setMinimizedExecutions((current) => {
      let changed = false;
      const next = { ...current };
      for (const execution of executionList) {
        if (next[execution.executionId] !== undefined) {
          continue;
        }
        next[execution.executionId] = focusExecutionId
          ? execution.executionId !== focusExecutionId
          : false;
        changed = true;
      }
      return changed ? next : current;
    });
  }, [executionList, focusExecutionId]);

  useEffect(() => {
    if (executionList.length === 0) {
      return;
    }
    setExecutionRerunDrafts((current) => {
      let changed = false;
      const next = { ...current };
      for (const execution of executionList) {
        if (next[execution.executionId]) {
          continue;
        }
        next[execution.executionId] = { steps: "", from: "", to: "" };
        changed = true;
      }
      return changed ? next : current;
    });
  }, [executionList]);

  useEffect(() => {
    if (runs.length === 0) {
      return;
    }
    setRunRerunDrafts((current) => {
      let changed = false;
      const next = { ...current };
      for (const run of runs) {
        if (next[run.runId]) {
          continue;
        }
        next[run.runId] = { steps: "", from: "", to: "" };
        changed = true;
      }
      return changed ? next : current;
    });
  }, [runs]);
  const navItems: Array<{ key: TabKey; label: string }> = [
    { key: "plans", label: "Planos" },
    { key: "examples", label: "Exemplos" },
    { key: "executions", label: "Execucoes" },
    { key: "runs", label: "Runs" },
    { key: "reports", label: "Relatorios" },
    { key: "triggers", label: "Gatilhos" }
  ];

  return (
    <AppShell
      topbar={(
        <Topbar>
          <div className="topbar__meta">
            <p className="eyebrow">Dashboard de Automacao</p>
            <h1 className="topbar__title">Planos, runs e gatilhos</h1>
            <p className="topbar__subtitle">Execute planos, acompanhe execucoes e gerencie gatilhos.</p>
          </div>
          <div className="topbar__actions">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              className="topbar__menu"
            >
              Navegacao
            </Button>
          </div>
        </Topbar>
      )}
      sidebar={(
        <Sidebar className={sidebarOpen ? "is-open" : ""} id="app-sidebar">
          <h2 className="sidebar__title">Navegacao</h2>
          <nav className="sidebar__nav">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={tabPaths[item.key]}
                className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}
                data-testid={`tab-${item.key}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </Sidebar>
      )}
    >
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="content">

        {tab === "plans" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Scenarios</h2>
                <p>Real workflows and production-like flows.</p>
              </div>
              <Button variant="primary" onClick={() => loadPlans()} disabled={plansLoading}>
                {plansLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
            <div className="filter-bar">
              <input
                placeholder="Filter scenarios by name, env, ticket, path..."
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => setPlanFilter("")}>Clear</Button>
            </div>
            {plansLoading ? (
              <div className="empty"><LoaderCircle className="empty__icon" size={16} />Loading plans...</div>
            ) : filteredPlans.length === 0 ? (
              <div className="empty"><Search className="empty__icon" size={16} />No plans found</div>
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
                    const validationErrors = plan.validationErrors ?? [];
                    const hasValidationErrors = validationErrors.length > 0;
                    const isCollapsed = collapsedPlanCards[plan.path] ?? false;
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
                              {hasValidationErrors && <span className="pill error">invalid</span>}
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
                        {!isCollapsed && plan.config && (
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
                        {!isCollapsed && (
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
                          <Button
                            variant="ghost"
                            size="sm"
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
                            disabled={hasValidationErrors}
                          >
                            Run range
                          </Button>
                        </div>
                        )}
                        <div className="actions">
                          <Button variant="ghost" size="sm" onClick={() => selectPlan(plan.path)}>
                            View plan
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePlanCollapse(plan.path)}
                          >
                            {isCollapsed ? "Expand details" : "Collapse details"}
                          </Button>
                          <Button
                            variant="primary"
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
                                inputs: payload.inputs,
                                switchTab: true
                              });
                            }}
                            disabled={hasValidationErrors}
                          >
                            Run selected steps
                          </Button>
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
              <Button variant="primary" onClick={() => loadExamples()} disabled={examplesLoading}>
                {examplesLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
            <div className="filter-bar">
              <input
                placeholder="Filter examples by name, env, ticket, path..."
                value={exampleFilter}
                onChange={(event) => setExampleFilter(event.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => setExampleFilter("")}>Clear</Button>
            </div>
            {examplesLoading ? (
              <div className="empty"><LoaderCircle className="empty__icon" size={16} />Loading examples...</div>
            ) : filteredExamples.length === 0 ? (
              <div className="empty"><FlaskConical className="empty__icon" size={16} />No examples found</div>
            ) : (
              <div className="grid" data-testid="plans-grid">
                {filteredExamples.map((plan) => {
                  const selectedSteps = getSelectedSteps(plan.path);
                  const typeCounts = getStepTypeCounts(plan.steps);
                  const rangeDraft = rangeDrafts[plan.path] || { from: "", to: "" };
                  const validationErrors = plan.validationErrors ?? [];
                  const hasValidationErrors = validationErrors.length > 0;
                  const isCollapsed = collapsedPlanCards[plan.path] ?? false;
                  return (
                    <article className="card plan-card" data-testid="plan-card" key={plan.path}>
                      <div className="plan-top">
                        <div className="plan-main">
                          <div className="plan-title">
                            <h3>{plan.feature}</h3>
                            <span className="pill">{plan.stepsCount} steps</span>
                            <span className="pill example">example</span>
                            {hasValidationErrors && <span className="pill error">invalid</span>}
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
                      {!isCollapsed && (
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
                        <Button
                          variant="ghost"
                          size="sm"
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
                          disabled={hasValidationErrors}
                        >
                          Run range
                        </Button>
                      </div>
                      )}
                      <div className="actions">
                        <Button variant="ghost" size="sm" onClick={() => selectPlan(plan.path)}>
                          View plan
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePlanCollapse(plan.path)}
                        >
                          {isCollapsed ? "Expand details" : "Collapse details"}
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            if (selectedSteps.length === 0) {
                              showToast("Select at least one step");
                              return;
                            }
                            void runPlan(plan.path, undefined, { selectedSteps });
                          }}
                          disabled={hasValidationErrors}
                        >
                          Run selected steps
                        </Button>
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
              <Button variant="primary" onClick={() => goToTab("runs")}>
                View runs
              </Button>
            </div>
            {!hasExecutions && (
              <div className="empty"><Clock className="empty__icon" size={16} />No executions yet</div>
            )}
            {hasExecutions && (
              <div className="stack">
                {executionList.map((execution) => {
                  const isFocused = execution.executionId === focusExecutionId;
                  const isMinimized = minimizedExecutions[execution.executionId] ?? false;
                  const isStepsMinimized = stepsMinimized[execution.executionId] ?? false;
                  const statusClass = getExecutionStatusClass(execution.status);
                  const rerunDraft = executionRerunDrafts[execution.executionId] ?? {
                    steps: "",
                    from: "",
                    to: ""
                  };
                  const canResume = Boolean(execution.runId && execution.planPath);
                  return (
                    <article
                      className={`card execution-card execution-card--${statusClass} ${isFocused ? "execution-card--active" : ""} ${isMinimized ? "execution-card--min" : ""}`}
                      key={execution.executionId}
                    >
                      <div className="card-header">
                        <div>
                          <h3>{execution.planPath}</h3>
                          <p className="muted">ID {execution.executionId}</p>
                        </div>
                        <div className="card-header-actions">
                          <span className={`pill ${execution.status}`}>{execution.status}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ChevronDown size={14} />}
                            onClick={() =>
                              setMinimizedExecutions((current) => ({
                                ...current,
                                [execution.executionId]: !isMinimized
                              }))
                            }
                          >
                            {isMinimized ? "Expandir execucao" : "Minimizar execucao"}
                          </Button>
                        </div>
                      </div>
                    {!isMinimized && (
                      <>
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
                            {execution.resumeFrom && (
                              <span>Resume: {execution.resumeFrom}</span>
                            )}
                          </div>
                          <div className="log-filters">
                            <select
                              value={logFilters[execution.executionId]?.level ?? "all"}
                            onChange={(event) =>
                              setLogFilters((current) => ({
                                ...current,
                                [execution.executionId]: {
                                  level: event.target.value as "all" | "error"
                                }
                              }))
                              }
                            >
                              <option value="all">All</option>
                              <option value="error">Errors</option>
                            </select>
                          </div>
                          {canResume && (
                            <div className="range execution-resume">
                              <label>
                                Steps
                                <input
                                  placeholder="1,3,4"
                                  value={rerunDraft.steps}
                                  className="execution-resume__steps"
                                  onChange={(event) =>
                                    setExecutionRerunDrafts((current) => ({
                                      ...current,
                                      [execution.executionId]: {
                                        ...rerunDraft,
                                        steps: event.target.value
                                      }
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                From
                                <input
                                  placeholder="1"
                                  value={rerunDraft.from}
                                  onChange={(event) =>
                                    setExecutionRerunDrafts((current) => ({
                                      ...current,
                                      [execution.executionId]: {
                                        ...rerunDraft,
                                        from: event.target.value
                                      }
                                    }))
                                  }
                                />
                              </label>
                              <label>
                                To
                                <input
                                  placeholder="4"
                                  value={rerunDraft.to}
                                  onChange={(event) =>
                                    setExecutionRerunDrafts((current) => ({
                                      ...current,
                                      [execution.executionId]: {
                                        ...rerunDraft,
                                        to: event.target.value
                                      }
                                    }))
                                  }
                                />
                              </label>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={execution.status === "running"}
                                onClick={() => {
                                  if (!execution.runId) {
                                    return;
                                  }
                                  const steps = parseStepsInput(rerunDraft.steps);
                                  if (rerunDraft.steps.trim().length > 0 && !steps) {
                                    showToast({ message: "Selected steps are invalid.", tone: "warning" });
                                    return;
                                  }
                                  const fromStep = parseRangeInput(rerunDraft.from);
                                  if (rerunDraft.from.trim().length > 0 && fromStep === undefined) {
                                    showToast({ message: "From step is invalid.", tone: "warning" });
                                    return;
                                  }
                                  const toStep = parseRangeInput(rerunDraft.to);
                                  if (rerunDraft.to.trim().length > 0 && toStep === undefined) {
                                    showToast({ message: "To step is invalid.", tone: "warning" });
                                    return;
                                  }
                                  const range =
                                    fromStep || toStep ? { fromStep, toStep } : undefined;
                                  void runPlan(execution.planPath, range, {
                                    selectedSteps: steps,
                                    resumeFrom: execution.runId
                                  });
                                }}
                              >
                                Run again (resume)
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    <div className="actions">
                      {execution.runId ? (
                        <a className="btn btn--ghost btn--sm" href={`/runs/${execution.runId}/index.html`}>
                          Abrir run
                        </a>
                      ) : null}
                      {!isMinimized && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setStepsMinimized((current) => ({
                              ...current,
                              [execution.executionId]: !isStepsMinimized
                            }))
                          }
                        >
                          {isStepsMinimized ? "Expandir steps" : "Minimizar steps"}
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => stopExecution(execution.executionId)}
                        disabled={execution.status !== "running"}
                      >
                        Stop
                      </Button>
                    </div>
                    {!isMinimized && execution.output && execution.output.length > 0 && (
                      <div className="output-groups">
                          {renderExecutionOutput(
                            execution.output,
                            logFilters[execution.executionId]?.level ?? "all",
                            isStepsMinimized,
                            {
                              collapsed: collapsedOutputGroups[execution.executionId],
                              onToggle: (groupKey) => toggleOutputGroup(execution.executionId, groupKey),
                              onRetryStep: (stepNumber) => {
                                if (!execution.runId || !execution.planPath) {
                                  return;
                                }
                                void runPlan(
                                  execution.planPath,
                                  { fromStep: stepNumber },
                                  { resumeFrom: execution.runId }
                                );
                              },
                              canRetry: Boolean(execution.runId && execution.planPath && execution.status !== "running")
                            }
                          )}
                      </div>
                    )}
                  </article>
                );})}
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
              <Button variant="primary" onClick={() => loadRuns(runsPage, runsPageSize)}>
                Refresh
              </Button>
            </div>
            {runsLoading ? (
              <div className="empty"><LoaderCircle className="empty__icon" size={16} />Loading runs...</div>
            ) : runs.length === 0 ? (
              <div className="empty"><FolderOpen className="empty__icon" size={16} />No runs yet</div>
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
                      {run.resumeFrom && (
                        <div className="meta">
                          <span>Resume: {run.resumeFrom}</span>
                        </div>
                      )}
                      {run.planPath && (
                        <div className="range execution-resume">
                          <label>
                            Steps
                            <input
                              placeholder="1,3,4"
                              className="execution-resume__steps"
                              value={(runRerunDrafts[run.runId] ?? { steps: "" }).steps}
                              onChange={(event) =>
                                setRunRerunDrafts((current) => ({
                                  ...current,
                                  [run.runId]: {
                                    ...(current[run.runId] ?? { steps: "", from: "", to: "" }),
                                    steps: event.target.value
                                  }
                                }))
                              }
                            />
                          </label>
                          <label>
                            From
                            <input
                              placeholder="1"
                              value={(runRerunDrafts[run.runId] ?? { from: "" }).from}
                              onChange={(event) =>
                                setRunRerunDrafts((current) => ({
                                  ...current,
                                  [run.runId]: {
                                    ...(current[run.runId] ?? { steps: "", from: "", to: "" }),
                                    from: event.target.value
                                  }
                                }))
                              }
                            />
                          </label>
                          <label>
                            To
                            <input
                              placeholder="4"
                              value={(runRerunDrafts[run.runId] ?? { to: "" }).to}
                              onChange={(event) =>
                                setRunRerunDrafts((current) => ({
                                  ...current,
                                  [run.runId]: {
                                    ...(current[run.runId] ?? { steps: "", from: "", to: "" }),
                                    to: event.target.value
                                  }
                                }))
                              }
                            />
                          </label>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              const draft = runRerunDrafts[run.runId] ?? { steps: "", from: "", to: "" };
                              const steps = parseStepsInput(draft.steps);
                              if (draft.steps.trim().length > 0 && !steps) {
                                showToast({ message: "Selected steps are invalid.", tone: "warning" });
                                return;
                              }
                              const fromStep = parseRangeInput(draft.from);
                              if (draft.from.trim().length > 0 && fromStep === undefined) {
                                showToast({ message: "From step is invalid.", tone: "warning" });
                                return;
                              }
                              const toStep = parseRangeInput(draft.to);
                              if (draft.to.trim().length > 0 && toStep === undefined) {
                                showToast({ message: "To step is invalid.", tone: "warning" });
                                return;
                              }
                              const range =
                                fromStep || toStep ? { fromStep, toStep } : undefined;
                              void runPlan(run.planPath || "", range, {
                                selectedSteps: steps,
                                resumeFrom: run.runId
                              });
                            }}
                          >
                            Run again (resume)
                          </Button>
                        </div>
                      )}
                        <div className="actions">
                          <a className="btn btn--ghost btn--sm" href={`/runs/${run.runId}/index.html`}>
                            Open
                          </a>
                          {run.logsUrl && (
                            <a className="btn btn--ghost btn--sm" href={run.logsUrl}>
                              Logs
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const next = !(runStepsExpanded[run.runId] ?? false);
                              setRunStepsExpanded((current) => ({ ...current, [run.runId]: next }));
                              if (next && !reportDetailsByRun[run.runId]) {
                                void loadRunDetails(run.runId);
                              }
                            }}
                          >
                            {runStepsExpanded[run.runId] ? "Hide steps" : "Show steps"}
                          </Button>
                          {run.planPath && (
                            <Button
                              variant="primary"
                              size="sm"
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
                            </Button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => deleteRun(run.runId)}>
                            Delete
                          </Button>
                        </div>
                      {runStepsExpanded[run.runId] && (
                        <div className="details">
                          {reportDetailsByRun[run.runId]?.summary?.steps ? (
                            <div className="stack">
                              {(reportDetailsByRun[run.runId].summary.steps as Array<{ id?: string; type?: string; status?: string }>)
                                .map((step, index) => ({ step, index }))
                                .filter((item) => item.step.status === "FAIL")
                                .map((item) => (
                                  <div className="card" key={`${run.runId}-step-${item.index}`}>
                                    <div className="card-header">
                                      <div>
                                        <h4>{item.step.id || `step-${item.index + 1}`}</h4>
                                        <p className="muted">{item.step.type || "step"} · {item.step.status || "UNKNOWN"}</p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          run.planPath &&
                                          runPlan(
                                            run.planPath,
                                            { fromStep: item.index + 1 },
                                            { resumeFrom: run.runId }
                                          )
                                        }
                                      >
                                        Try again from here
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="empty"><LoaderCircle className="empty__icon" size={16} />Loading steps...</div>
                          )}
                        </div>
                      )}
                      </article>
                    ))}
                  </div>
                )}
            <div className="pagination">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRunsPage(Math.max(1, runsPage - 1))}
                disabled={runsPage <= 1}
              >
                Previous
              </Button>
              <span>Page {runsPage} of {totalPages}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRunsPage(Math.min(totalPages, runsPage + 1))}
                disabled={runsPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </section>
        )}

        {tab === "reports" && (
          <ReportsPanel
            reportRuns={reportRuns}
            reportRunsLoading={reportRunsLoading}
            reportRunId={reportRunId}
            reportDetailsByRun={reportDetailsByRun}
            reportName={reportName}
            reportBlocks={reportBlocks}
            reportLinks={reportLinks}
            reportLibrary={reportLibrary}
            activeReportId={activeReportId}
            canGenerateReport={canGenerateReport}
            evidencePicker={evidencePicker}
            evidenceSearch={evidenceSearch}
            onRefreshRuns={loadReportRuns}
            onReportNameChange={setReportName}
            onReloadRun={() => reportRunId && loadRunDetails(reportRunId)}
    onGenerateReport={(blocks) => generateReport(undefined, blocks)}
            onAddReportBlock={addReportBlock}
            onUpdateReportBlock={updateReportBlock}
            onMoveReportBlock={moveReportBlock}
            onRemoveReportBlock={removeReportBlock}
            onSaveReport={() => saveReportDraft()}
            onSaveReportAsNew={() => saveReportDraft({ asNew: true })}
            onStartNewReport={startNewReportDraft}
            onLoadReport={loadReportDraft}
            onDeleteReport={deleteReportDraft}
            onGenerateReportFromLibrary={(id) => {
              const draft = reportLibrary.find((item) => item.id === id);
              if (draft) {
                void generateReport(draft);
              }
            }}
            onOpenEvidencePicker={openEvidencePicker}
            onCloseEvidencePicker={closeEvidencePicker}
            onEvidenceSearchChange={setEvidenceSearch}
            onEvidenceSelectionChange={handleEvidenceSelectionChange}
          />
        )}

        {tab === "triggers" && (
          <section className="section">
            <div className="section-title">
              <div>
                <h2>Triggers</h2>
                <p>Create and manage trigger status.</p>
              </div>
              <Button variant="primary" onClick={() => loadTriggers()} disabled={triggersLoading}>
                {triggersLoading ? "Loading..." : "Refresh"}
              </Button>
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
              <Button variant="primary" type="submit">Create</Button>
            </form>
            {triggersLoading ? (
              <div className="empty"><LoaderCircle className="empty__icon" size={16} />Loading triggers...</div>
            ) : triggers.length === 0 ? (
              <div className="empty"><Timer className="empty__icon" size={16} />No triggers configured</div>
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
                        <a className="btn btn--ghost btn--sm" href={trigger.logsUrl} target="_blank" rel="noreferrer">
                          Logs
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => updateTrigger(trigger.id, { status: "observing" })}>
                        Start
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => updateTrigger(trigger.id, { status: "stopped" })}>
                        Stop
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => updateTrigger(trigger.id, { status: "success" })}>
                        Success
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => updateTrigger(trigger.id, { status: "error" })}>
                        Error
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => deleteTrigger(trigger.id)}>
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {toast && (
        <div
          className={`toast ${toast.tone}`}
          style={{ "--toast-duration": `${toast.durationMs}ms` } as React.CSSProperties}
        >
          <div className="toast__content">
            <strong className="toast__title">{toast.title}</strong>
            <span className="toast__message">{toast.message}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setToast(null)}>Fechar</Button>
          <div className="toast__progress" />
        </div>
      )}

    </AppShell>
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

function truncateText(value: string, max: number) {
  if (!value || value.length <= max) {
    return value;
  }
  return value.slice(0, Math.max(1, max - 3)) + "...";
}

function parseRangeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStepsInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = trimmed
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item));
  const unique = Array.from(new Set(parsed)).sort((a, b) => a - b);
  return unique.length > 0 ? unique : undefined;
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

function renderExecutionOutput(
  output: string[],
  level: "all" | "error",
  compact = false,
  options?: {
    collapsed?: Record<string, boolean>;
    onToggle?: (groupKey: string) => void;
    onRetryStep?: (stepNumber: number) => void;
    canRetry?: boolean;
  }
) {
  const lines = output.join("").split(/\r?\n/);
  const filteredLines = filterExecutionLines(lines, "", level);
  const groups = groupOutputByStep(filteredLines);
  if (groups.length === 0) {
    return <div className="output">No output yet</div>;
  }
  const collapsed = options?.collapsed ?? {};
  return groups.map((group) => (
    <div className="output-group" key={group.title}>
      <div className={`output-header ${group.statusClass}`}>
        <span>{group.title}</span>
        <span className="output-meta">
          {group.cacheHit ? (
            <span className="cache-pill">
              cache{group.cacheKey ? ` ${group.cacheKey.slice(0, 8)}` : ""}
            </span>
          ) : null}
          {group.cacheInputs ? (
            <span className="cache-pill">inputs {truncateText(group.cacheInputs, 42)}</span>
          ) : null}
          {typeof group.attempts === "number" ? (
            <span className="attempts-pill">attempts {group.attempts}</span>
          ) : null}
          {group.errorCount ? <span className="error-pill">errors {group.errorCount}</span> : null}
          {formatGroupStatus(group)}
          {group.stepNumber && options?.onRetryStep ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => options.onRetryStep?.(group.stepNumber as number)}
              disabled={options.canRetry === false}
            >
              Try again from here
            </Button>
          ) : null}
          {!compact && options?.onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => options.onToggle?.(group.title)}
            >
              {collapsed[group.title] ? "Expand step" : "Collapse step"}
            </Button>
          )}
        </span>
      </div>
      {!compact && !collapsed[group.title] && <pre className="output">{group.lines.join("\n")}</pre>}
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
    cacheKey?: string;
    cacheInputs?: string;
    attempts?: number;
    errorCount?: number;
    stepNumber?: number;
  }> = [];
  let current = createGroup("General logs");
  for (const line of lines) {
    if (!line) continue;
    const match = line.match(/Step\s+(\d{2})\/(\d+)\s+(.+)/);
    if (match) {
      if (current.lines.length > 0) groups.push(current);
      current = createGroup(`Step ${match[1]}: ${match[3]}`, match[1]);
    }
    current.lines.push(line);
    updateGroupStatus(current, line);
  }
  if (current.lines.length > 0) groups.push(current);
  return groups;
}

function createGroup(title: string, stepNumber?: string) {
  const parsedStep = stepNumber ? Number.parseInt(stepNumber, 10) : undefined;
  return {
    title,
    lines: [] as string[],
    statusLabel: "RUNNING",
    statusClass: "running",
    cacheHit: false,
    cacheKey: undefined,
    cacheInputs: undefined,
    attempts: undefined,
    errorCount: 0,
    stepNumber: Number.isFinite(parsedStep) ? parsedStep : undefined
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
  const cacheKeyMatch = line.match(/cacheKey=([a-f0-9]+)/i);
  if (cacheKeyMatch) {
    group.cacheKey = cacheKeyMatch[1];
  }
  const cacheInputsMatch = line.match(/cacheInputs=([^\s]+)/i);
  if (cacheInputsMatch) {
    group.cacheInputs = cacheInputsMatch[1];
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

function getExecutionStatusClass(status?: string) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "running") return "running";
  if (normalized === "completed" || normalized === "ok") return "success";
  if (normalized === "failed" || normalized === "error") return "error";
  if (normalized === "stopped") return "warning";
  return "neutral";
}
