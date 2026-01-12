import { Context } from "./context";
import { ExportRule } from "./types";

export interface ExportSources {
  sqlRows?: Array<Record<string, string>>;
  responseText?: string;
  stdout?: string;
  stderr?: string;
}

export function applyExports(
  context: Context,
  rules: Record<string, ExportRule> | undefined,
  sources: ExportSources
): void {
  if (!rules) {
    return;
  }
  for (const [key, rule] of Object.entries(rules)) {
    context[key] = extractValue(rule, sources);
  }
}

function extractValue(rule: ExportRule, sources: ExportSources): string {
  if (rule.source === "sql") {
    if (!sources.sqlRows) {
      throw new Error("sql export requires sqlRows source");
    }
    const rowIndex = rule.row ?? 0;
    const row = sources.sqlRows[rowIndex];
    if (!row) {
      throw new Error(`sql export row not found: ${rowIndex}`);
    }
    const value = row[rule.column];
    if (value === undefined) {
      throw new Error(`sql export column not found: ${rule.column}`);
    }
    return String(value);
  }

  if (rule.source === "responseText") {
    return extractTextValue("responseText", sources.responseText ?? "", rule);
  }

  if (rule.source === "stdout") {
    return extractTextValue("stdout", sources.stdout ?? "", rule);
  }

  if (rule.source === "stderr") {
    return extractTextValue("stderr", sources.stderr ?? "", rule);
  }

  throw new Error("Unsupported export rule");
}

function extractTextValue(source: string, text: string, rule: { regex?: string; jsonPath?: string }): string {
  if (rule.regex) {
    const match = new RegExp(rule.regex).exec(text);
    if (!match || !match[1]) {
      throw new Error(`regex did not match for export: ${rule.regex}`);
    }
    return match[1];
  }
  if (rule.jsonPath) {
    const json = JSON.parse(text) as Record<string, unknown>;
    const value = getByJsonPath(json, rule.jsonPath);
    if (value === undefined || value === null) {
      throw new Error(`jsonPath not found: ${rule.jsonPath}`);
    }
    return String(value);
  }
  throw new Error(`${source} export requires regex or jsonPath`);
}

function getByJsonPath(value: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = value;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}
