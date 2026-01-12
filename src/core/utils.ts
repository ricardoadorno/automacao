export function nowIso(): string {
  return new Date().toISOString();
}

export function createRunId(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${stamp}_${rand}`;
}
