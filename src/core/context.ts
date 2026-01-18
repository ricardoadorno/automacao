export type Context = Record<string, string>;

export function resolveTemplate(input: string, context: Context): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    if (context[key] === undefined) {
      throw new Error(`Missing context value for ${key}`);
    }
    return context[key];
  });
}

export function resolveTemplatesDeep<T>(input: T, context: Context): T {
  if (typeof input === "string") {
    return resolveTemplate(input, context) as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => resolveTemplatesDeep(item, context)) as T;
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      out[key] = resolveTemplatesDeep(value, context);
    }
    return out as T;
  }
  return input;
}
