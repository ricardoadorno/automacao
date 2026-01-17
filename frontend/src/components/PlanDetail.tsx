import { Plan, PlanStep, InputsDraft } from "../types";
import {
  addRow,
  updateRow,
  removeRow,
  updateItem,
  removeItem
} from "../lib/inputs";
import { Button } from "../design-system";

type PlanDetailProps = {
  plan: Plan;
  selections: Record<number, boolean>;
  selectedSteps: number[];
  inputsDraft?: InputsDraft;
  onClose: () => void;
  onToggleStep: (stepIndex: number) => void;
  onToggleAllSteps: () => void;
  onInputsChange: (patch: Partial<InputsDraft>) => void;
  onRun: () => void;
  onReset: () => void;
  formatStepDetails: (step: PlanStep) => string;
};

export function PlanDetail({
  plan,
  selections,
  selectedSteps,
  inputsDraft,
  onClose,
  onToggleStep,
  onToggleAllSteps,
  onInputsChange,
  onRun,
  onReset,
  formatStepDetails
}: PlanDetailProps) {
  const allStepsSelected = plan.steps.length > 0 && selectedSteps.length === plan.steps.length;
  const defaultsRows = inputsDraft?.defaultsRows ?? [];
  const overridesRows = inputsDraft?.overridesRows ?? [];
  const itemsRows = inputsDraft?.itemsRows ?? [];
  const errors = inputsDraft?.errors ?? [];
  const validationErrors = plan.validationErrors ?? [];
  const hasValidationErrors = validationErrors.length > 0;
  return (
    <div className="card plan-detail-card">
      <div className="plan-detail-header">
        <div>
          <h3>{plan.feature}</h3>
          <p className="muted">{plan.path}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>
      <div className="meta">
        {plan.ticket && <span>Ticket: {plan.ticket}</span>}
        {plan.env && <span>Env: {plan.env}</span>}
        <span>{plan.stepsCount} steps</span>
      </div>
      {hasValidationErrors && (
        <div className="input-errors">
          {validationErrors.map((error, idx) => (
            <div key={`plan-err-${idx}`}>{error.path}: {error.message}</div>
          ))}
        </div>
      )}
      <div className="detail-section">
        <div className="detail-title">
          <h4>Inputs for this run</h4>
          <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>
        </div>
        <div className="inputs-grid">
          <label>
            Env prefix
            <input
              value={inputsDraft?.envPrefix ?? ""}
              onChange={(event) => onInputsChange({ envPrefix: event.target.value })}
              placeholder="AUTO_"
            />
            <span className="helper">Variaveis AUTO_X viram X no contexto.</span>
          </label>
          <div className="kv-editor">
            <div className="kv-header">
              <span>Defaults</span>
              <Button variant="ghost" size="sm" onClick={() => onInputsChange({ defaultsRows: addRow(defaultsRows) })}>
                Add
              </Button>
            </div>
            {defaultsRows.length === 0 && <span className="helper">Sem defaults.</span>}
            {defaultsRows.map((row, idx) => (
              <div className="kv-row" key={`def-${idx}`}>
                <input
                  placeholder="key"
                  value={row.key}
                  onChange={(event) =>
                    onInputsChange({ defaultsRows: updateRow(defaultsRows, idx, { key: event.target.value }) })
                  }
                />
                <input
                  placeholder="value"
                  value={row.value}
                  onChange={(event) =>
                    onInputsChange({ defaultsRows: updateRow(defaultsRows, idx, { value: event.target.value }) })
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => onInputsChange({ defaultsRows: removeRow(defaultsRows, idx) })}>
                  Remove
                </Button>
              </div>
            ))}
            <span className="helper">Use para valores base (ex: baseUrl, timeout).</span>
          </div>
          <div className="kv-editor">
            <div className="kv-header">
              <span>Overrides</span>
              <Button variant="ghost" size="sm" onClick={() => onInputsChange({ overridesRows: addRow(overridesRows) })}>
                Add
              </Button>
            </div>
            {overridesRows.length === 0 && <span className="helper">Sem overrides.</span>}
            {overridesRows.map((row, idx) => (
              <div className="kv-row" key={`ovr-${idx}`}>
                <input
                  placeholder="key"
                  value={row.key}
                  onChange={(event) =>
                    onInputsChange({ overridesRows: updateRow(overridesRows, idx, { key: event.target.value }) })
                  }
                />
                <input
                  placeholder="value"
                  value={row.value}
                  onChange={(event) =>
                    onInputsChange({ overridesRows: updateRow(overridesRows, idx, { value: event.target.value }) })
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => onInputsChange({ overridesRows: removeRow(overridesRows, idx) })}>
                  Remove
                </Button>
              </div>
            ))}
            <span className="helper">Overrides substituem defaults no run.</span>
          </div>
          <div className="kv-editor">
            <div className="kv-header">
              <span>Items / Loop</span>
              <Button variant="ghost" size="sm" onClick={() => onInputsChange({ itemsRows: [...itemsRows, "{"] })}>
                Add item
              </Button>
            </div>
            {itemsRows.length === 0 && <span className="helper">Sem items. Loop desativado.</span>}
            {itemsRows.map((item, idx) => (
              <div className="item-row" key={`item-${idx}`}>
                <textarea
                  rows={4}
                  value={item}
                  onChange={(event) =>
                    onInputsChange({ itemsRows: updateItem(itemsRows, idx, event.target.value) })
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => onInputsChange({ itemsRows: removeItem(itemsRows, idx) })}>
                  Remove
                </Button>
              </div>
            ))}
            <span className="helper">Cada item e um objeto JSON usado no loop.</span>
          </div>
        </div>
        {errors.length > 0 && (
          <div className="input-errors">
            {errors.map((error, idx) => (
              <div key={`err-${idx}`}>{error}</div>
            ))}
          </div>
        )}
      </div>
      <div className="detail-section">
        <div className="detail-title">
          <h4>Steps</h4>
          <label className="checkbox">
            <input type="checkbox" checked={allStepsSelected} onChange={onToggleAllSteps} />
            <span>Select all</span>
          </label>
        </div>
        <div className="steps">
          {plan.steps.map((step) => (
            <div className="step" key={`${plan.path}-detail-${step.index}`}>
              <label className="step-title">
                <input
                  type="checkbox"
                  checked={Boolean(selections[step.index])}
                  onChange={() => onToggleStep(step.index)}
                />
                <span className="pill">{step.type}</span>
                <span>{step.description}</span>
              </label>
              <div className="muted">#{step.index} {step.id}</div>
              {step.details && <div className="muted">{formatStepDetails(step)}</div>}
              {step.raw ? (
                <details className="raw-details">
                  <summary>Step details</summary>
                  <pre className="output">{JSON.stringify(step.raw, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <Button variant="primary" onClick={onRun} disabled={hasValidationErrors}>
        Run selected steps
      </Button>
    </div>
  );
}
