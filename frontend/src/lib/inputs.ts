import { InputRow } from "../types";

export function toRows(input?: Record<string, unknown>) {
  if (!input || typeof input !== "object") {
    return [] as InputRow[];
  }
  return Object.entries(input).map(([key, value]) => ({
    key,
    value: String(value)
  }));
}

export function addRow(rows: InputRow[]) {
  return [...rows, { key: "", value: "" }];
}

export function updateRow(rows: InputRow[], index: number, patch: Partial<InputRow>) {
  return rows.map((row, idx) => (idx === index ? { ...row, ...patch } : row));
}

export function removeRow(rows: InputRow[], index: number) {
  return rows.filter((_, idx) => idx !== index);
}

export function updateItem(items: string[], index: number, value: string) {
  return items.map((item, idx) => (idx === index ? value : item));
}

export function removeItem(items: string[], index: number) {
  return items.filter((_, idx) => idx !== index);
}

export function parseValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export function rowsToObject(rows: InputRow[]) {
  const output: Record<string, unknown> = {};
  for (const row of rows) {
    if (!row.key.trim()) continue;
    output[row.key.trim()] = parseValue(row.value);
  }
  return output;
}

export function parseItemsRows(itemsRows: string[]) {
  const items: Array<Record<string, unknown>> = [];
  const errors: string[] = [];
  itemsRows.forEach((text, idx) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        items.push(parsed as Record<string, unknown>);
      } else {
        errors.push(`Item ${idx + 1}: expected JSON object`);
      }
    } catch {
      errors.push(`Item ${idx + 1}: invalid JSON`);
    }
  });
  return { items, errors };
}
