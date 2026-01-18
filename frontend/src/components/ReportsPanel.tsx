import { useMemo, useState } from "react";
import { useMemo, useState } from "react";
import { Button } from "../design-system";
import type { ReportBlock, RunDetails, RunSummary, SavedReport } from "../types";

type ReportLinks = { jsonUrl?: string; htmlUrl?: string; docxUrl?: string } | null;

type EvidencePickerState = {
  open: boolean;
  blockId?: string;
  runId?: string;
  stepId?: string;
  filename?: string;
};

type EvidenceSelection = {
  runId: string;
  stepId: string;
  filename: string;
};

type ReportsPanelProps = {
  reportRuns: RunSummary[];
  reportRunsLoading: boolean;
  reportRunId: string;
  reportDetailsByRun: Record<string, RunDetails>;
  reportName: string;
  reportBlocks: ReportBlock[];
  reportLinks: ReportLinks;
  reportLibrary: SavedReport[];
  activeReportId: string | null;
  canGenerateReport: boolean;
  evidencePicker: EvidencePickerState;
  evidenceSearch: string;
  onRefreshRuns: () => void;
  onReportNameChange: (value: string) => void;
  onReloadRun: () => void;
  onGenerateReport: (blocks?: ReportBlock[]) => void;
  onAddReportBlock: (type: ReportBlock["type"]) => void;
  onUpdateReportBlock: (id: string, patch: Partial<ReportBlock>) => void;
  onMoveReportBlock: (id: string, direction: -1 | 1) => void;
  onRemoveReportBlock: (id: string) => void;
  onSaveReport: () => void;
  onSaveReportAsNew: () => void;
  onStartNewReport: () => void;
  onLoadReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onGenerateReportFromLibrary: (id: string) => void;
  onOpenEvidencePicker: (blockId: string) => void;
  onCloseEvidencePicker: () => void;
  onEvidenceSearchChange: (value: string) => void;
  onEvidenceSelectionChange: (value: EvidenceSelection | null) => void;
};

export function ReportsPanel({
  reportRuns,
  reportRunsLoading,
  reportRunId,
  reportDetailsByRun,
  reportName,
  reportBlocks,
  reportLinks,
  reportLibrary,
  activeReportId,
  canGenerateReport,
  evidencePicker,
  evidenceSearch,
  onRefreshRuns,
  onReportNameChange,
  onReloadRun,
  onGenerateReport,
  onAddReportBlock,
  onUpdateReportBlock,
  onMoveReportBlock,
  onRemoveReportBlock,
  onSaveReport,
  onSaveReportAsNew,
  onStartNewReport,
  onLoadReport,
  onDeleteReport,
  onGenerateReportFromLibrary,
  onOpenEvidencePicker,
  onCloseEvidencePicker,
  onEvidenceSearchChange,
  onEvidenceSelectionChange
}: ReportsPanelProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const previewBlocks = useMemo(() => {
    let currentIndent = 0;
    return reportBlocks
      .filter((block) => block.enabled !== false)
      .map((block) => {
        const headingLevel = getHeadingLevel(block.type);
        const indent = headingLevel ? getIndentLevel(headingLevel) : currentIndent;
        if (headingLevel) {
          currentIndent = headingLevel;
        }
        return { block, indent };
      });
  }, [reportBlocks]);

  const blockIndentations = useMemo(() => {
    const map = new Map<string, number>();
    let currentIndent = 0;
    reportBlocks.forEach((block) => {
      const headingLevel = getHeadingLevel(block.type);
      const indent = headingLevel ? getIndentLevel(headingLevel) : currentIndent;
      if (headingLevel) {
        currentIndent = headingLevel;
      }
      map.set(block.id, indent);
    });
    return map;
  }, [reportBlocks]);

  const exportLinks = useMemo(() => {
    if (reportLinks) return reportLinks;
    const active = reportLibrary.find((item) => item.id === activeReportId);
    return active?.exports ?? null;
  }, [reportLinks, reportLibrary, activeReportId]);

  function handleConfirmEvidencePicker() {
    if (!evidencePicker.blockId) {
      onCloseEvidencePicker();
      return;
    }
    const step = getRunStep(
      getRunDetails(reportDetailsByRun, evidencePicker.runId),
      evidencePicker.stepId
    );
    onUpdateReportBlock(evidencePicker.blockId, {
      runId: evidencePicker.runId,
      stepId: evidencePicker.stepId,
      filename: evidencePicker.filename,
      stepDir: step?.stepDir || ""
    });
    onCloseEvidencePicker();
  }

  return (
    <>
      <section className="section">
        <div className="section-title">
          <div>
            <h2>Reports</h2>
            <p>Monte um documento com evidencias selecionadas.</p>
          </div>
          <Button variant="primary" onClick={onRefreshRuns} disabled={reportRunsLoading}>
            {reportRunsLoading ? "Loading..." : "Refresh runs"}
          </Button>
        </div>
        <div className="report-builder report-builder--full">
          <div className="card report-panel">
            <div className="report-controls">
              <label>
                Report name
                <input
                  value={reportName}
                  onChange={(event) => onReportNameChange(event.target.value)}
                  placeholder="relatorio"
                />
              </label>
              <div className="report-meta">
                <span className="muted">Draft</span>
                <strong>{activeReportId ? "Saved" : "Unsaved"}</strong>
              </div>
              <div className="report-inline-actions">
                <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
                  Preview
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setExportOpen(true)}>
                  Export
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setLibraryOpen(true)}>
                  Local library
                </Button>
                <Button variant="primary" size="sm" onClick={onSaveReport}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={onSaveReportAsNew}>
                  Save as new
                </Button>
                <Button variant="ghost" size="sm" onClick={onStartNewReport}>
                  New draft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReloadRun}
                  disabled={!reportRunId}
                >
                  Reload run
                </Button>
              </div>
            </div>
            <div className="report-actions">
              <Button variant="ghost" size="sm" onClick={() => onAddReportBlock("h1")}>Add H1</Button>
              <Button variant="ghost" size="sm" onClick={() => onAddReportBlock("h2")}>Add H2</Button>
              <Button variant="ghost" size="sm" onClick={() => onAddReportBlock("h3")}>Add H3</Button>
              <Button variant="ghost" size="sm" onClick={() => onAddReportBlock("h4")}>Add H4</Button>
              <Button variant="ghost" size="sm" onClick={() => onAddReportBlock("p")}>Add P</Button>
              <Button variant="ghost" size="sm" onClick={() => onAddReportBlock("small")}>Add Small</Button>
              <Button variant="ghost" size="sm" onClick={() => onAddReportBlock("evidence")}>Add evidence</Button>
            </div>
            {reportBlocks.length === 0 ? (
              <div className="empty">Add blocks to start assembling the report.</div>
            ) : (
              <div className="report-blocks">
                {reportBlocks.map((block, index) => {
                  return (
                    <div
                      className={`report-block report-block--${block.type} ${block.enabled === false ? "disabled" : ""}`}
                      key={block.id}
                      style={{ marginLeft: `${(blockIndentations.get(block.id) ?? 0) * 16}px` }}
                    >
                      <div className="report-block-header">
                        <div className="report-block-title">
                          <span className="pill secondary">{block.type}</span>
                          <span className="muted">#{index + 1}</span>
                        </div>
                        <div className="report-block-actions">
                          <Button variant="ghost" size="sm" onClick={() => onMoveReportBlock(block.id, -1)}>Up</Button>
                          <Button variant="ghost" size="sm" onClick={() => onMoveReportBlock(block.id, 1)}>Down</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateReportBlock(block.id, { enabled: block.enabled === false })}
                          >
                            {block.enabled === false ? "Include" : "Skip"}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => onRemoveReportBlock(block.id)}>Remove</Button>
                        </div>
                      </div>
                      <div className="report-block-body">
                        {(block.type === "h1" ||
                          block.type === "h2" ||
                          block.type === "h3" ||
                          block.type === "h4" ||
                          block.type === "p" ||
                          block.type === "small") && (
                          <textarea
                            rows={block.type === "p" ? 4 : 2}
                            placeholder="Write text..."
                            value={block.text ?? ""}
                            onChange={(event) => onUpdateReportBlock(block.id, { text: event.target.value })}
                          />
                        )}
                        {block.type === "evidence" && (
                          <div className="report-evidence-form">
                            <label>
                              Label
                              <input
                                value={block.label ?? ""}
                                onChange={(event) => onUpdateReportBlock(block.id, { label: event.target.value })}
                              />
                            </label>
                            <label>
                              Caption
                              <input
                                value={block.caption ?? ""}
                                onChange={(event) => onUpdateReportBlock(block.id, { caption: event.target.value })}
                              />
                            </label>
                            <div className="report-evidence-row">
                              <div className="report-evidence-summary">
                                <span className="muted">
                                  {block.stepId && block.filename
                                    ? `${block.runId || reportRunId} / ${block.stepId} ??? ${block.filename}`
                                    : "No evidence selected"}
                                </span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => onOpenEvidencePicker(block.id)}>
                                Choose evidence
                              </Button>
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
        </div>
      </section>

      {exportOpen && (
        <div className="modal-backdrop" onClick={() => setExportOpen(false)}>
          <div className="modal report-export-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Export</h3>
              <Button variant="ghost" size="sm" onClick={() => setExportOpen(false)}>Close</Button>
            </div>
            <div className="card report-export">
              <div className="report-export-header">
                <div>
                  <h3>Export</h3>
                  <p className="muted">Gere o docx e publique os arquivos do report.</p>
                </div>
                <Button
                  variant="primary"
                  className="report-generate"
                  onClick={() => onGenerateReport(reportBlocks)}
                >
                  Generate docx
                </Button>
              </div>
              {!canGenerateReport && (
                <p className="muted">Selecione um run ou adicione uma evidence antes de gerar.</p>
              )}
              {exportLinks ? (
                <div className="report-export-grid">
                  {exportLinks.docxUrl && (
                    <div className="report-export-card">
                      <div className="report-export-thumb report-export-thumb--docx">DOCX</div>
                      <div className="report-export-info">
                        <strong>Docx</strong>
                        <span className="muted">Arquivo do Word</span>
                      </div>
                      <a className="btn btn--ghost btn--sm" href={exportLinks.docxUrl}>Download</a>
                    </div>
                  )}
                  {exportLinks.htmlUrl && (
                    <div className="report-export-card">
                      <div className="report-export-thumb report-export-thumb--html">HTML</div>
                      <div className="report-export-info">
                        <strong>HTML</strong>
                        <span className="muted">Preview web</span>
                      </div>
                      <a className="btn btn--ghost btn--sm" href={exportLinks.htmlUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  )}
                  {exportLinks.jsonUrl && (
                    <div className="report-export-card">
                      <div className="report-export-thumb report-export-thumb--json">JSON</div>
                      <div className="report-export-info">
                        <strong>JSON</strong>
                        <span className="muted">Dados do report</span>
                      </div>
                      <a className="btn btn--ghost btn--sm" href={exportLinks.jsonUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty">Gere o report para ver os arquivos exportados.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {libraryOpen && (
        <div className="modal-backdrop" onClick={() => setLibraryOpen(false)}>
          <div className="modal report-library-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Local library</h3>
              <Button variant="ghost" size="sm" onClick={() => setLibraryOpen(false)}>Close</Button>
            </div>
            <div className="card report-library">
              <div className="report-library-header">
                <div>
                  <h3>Local library</h3>
                  <p className="muted">Drafts salvos no navegador.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onSaveReport}>
                  Save draft
                </Button>
              </div>
              {reportLibrary.length === 0 ? (
                <div className="empty">Nenhum draft salvo ainda.</div>
              ) : (
                <div className="report-library-list">
                  {reportLibrary.map((item) => {
                    const isActive = item.id === activeReportId;
                    const baseRunId = getDraftBaseRunId(item.runId, item.blocks);
                    return (
                      <div className={`report-library-item ${isActive ? "active" : ""}`} key={item.id}>
                        <div className="report-library-title">
                          <strong>{item.name}</strong>
                          <span className="muted">{item.runId ? `Run ${item.runId}` : "No run selected"}</span>
                        </div>
                        <div className="report-library-meta">
                          <span className="muted">Atualizado {formatTimestamp(item.updatedAt)}</span>
                          {item.exports?.generatedAt ? (
                            <span className="muted">Export {formatTimestamp(item.exports.generatedAt)}</span>
                          ) : (
                            <span className="muted">Nao gerado</span>
                          )}
                        </div>
                        <div className="report-library-actions">
                          <Button variant="secondary" size="sm" onClick={() => onLoadReport(item.id)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onGenerateReportFromLibrary(item.id)}
                            disabled={!baseRunId}
                          >
                            Generate
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => onDeleteReport(item.id)}>
                            Delete
                          </Button>
                        </div>
                        {item.exports && (
                          <div className="report-library-exports">
                            {item.exports.docxUrl && (
                              <a className="btn btn--ghost btn--sm" href={item.exports.docxUrl}>
                                Docx
                              </a>
                            )}
                            {item.exports.htmlUrl && (
                              <a className="btn btn--ghost btn--sm" href={item.exports.htmlUrl} target="_blank" rel="noreferrer">
                                HTML
                              </a>
                            )}
                            {item.exports.jsonUrl && (
                              <a className="btn btn--ghost btn--sm" href={item.exports.jsonUrl} target="_blank" rel="noreferrer">
                                JSON
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="modal-backdrop" onClick={() => setPreviewOpen(false)}>
          <div className="modal report-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>Close</Button>
            </div>
            <div className="report-preview-body report-preview-modal-body">
              {previewBlocks.length === 0 ? (
                <div className="empty">Add blocks to preview the report.</div>
              ) : (
                previewBlocks.map(({ block, indent }) => {
                  const style = indent ? { marginLeft: `${indent * 16}px` } : undefined;
                  if (block.type === "h1") {
                    return <h1 key={block.id}>{block.text || "Untitled h1"}</h1>;
                  }
                  if (block.type === "h2") {
                    return <h2 key={block.id}>{block.text || "Untitled h2"}</h2>;
                  }
                  if (block.type === "h3") {
                    return <h3 key={block.id}>{block.text || "Untitled h3"}</h3>;
                  }
                  if (block.type === "h4") {
                    return <h4 key={block.id}>{block.text || "Untitled h4"}</h4>;
                  }
                  if (block.type === "p") {
                    return (
                      <p key={block.id} style={style}>{block.text || "..."}</p>
                    );
                  }
                  if (block.type === "small") {
                    return (
                      <small key={block.id} style={style}>{block.text || "..."}</small>
                    );
                  }
                  if (block.type === "evidence") {
                    const artifact = getRunArtifact(
                      reportDetailsByRun,
                      block.runId || reportRunId,
                      block.stepId,
                      block.filename
                    );
                    return (
                      <div className="report-evidence" key={block.id} style={style}>
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
                })
              )}
            </div>
          </div>
        </div>
      )}

      {evidencePicker.open && (
        <div className="modal-backdrop" onClick={onCloseEvidencePicker}>
          <div className="modal report-evidence-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose evidence</h3>
              <Button variant="ghost" size="sm" onClick={onCloseEvidencePicker}>Close</Button>
            </div>
            <div className="report-evidence-modal-body">
              <div className="report-evidence-selectors">
                <label>
                  Evidence
                  <input
                    className="report-evidence-search"
                    placeholder="Search by run, step, filename..."
                    value={evidenceSearch}
                    onChange={(event) => onEvidenceSearchChange(event.target.value)}
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
                        onEvidenceSelectionChange(null);
                        return;
                      }
                      const [runId, stepId, filename] = value.split("::");
                      onEvidenceSelectionChange({ runId, stepId, filename });
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
                    <a className="btn btn--ghost btn--sm" href={artifact.url} target="_blank" rel="noreferrer">
                      Open {artifact.filename}
                    </a>
                  );
                })()}
              </div>
            </div>
            <div className="report-evidence-modal-actions">
              <Button variant="ghost" size="sm" onClick={onCloseEvidencePicker}>Cancel</Button>
              <Button
                variant="primary"
                data-testid="report-modal-confirm"
                onClick={handleConfirmEvidencePicker}
                disabled={!evidencePicker.filename}
              >
                Confirm evidence
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
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

function getHeadingLevel(type: ReportBlock["type"]) {
  if (type === "h1") return 1;
  if (type === "h2") return 2;
  if (type === "h3") return 3;
  if (type === "h4") return 4;
  return 0;
}

function getIndentLevel(headingLevel: number) {
  if (headingLevel <= 1) return 0;
  if (headingLevel === 2) return 1;
  if (headingLevel === 3) return 2;
  if (headingLevel === 4) return 3;
  return Math.max(0, headingLevel - 1);
}

function getDraftBaseRunId(runId: string, blocks: ReportBlock[]) {
  if (runId) return runId;
  const firstEvidence = blocks.find((block) => block.type === "evidence" && block.runId);
  return firstEvidence?.runId ?? "";
}

function formatTimestamp(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
