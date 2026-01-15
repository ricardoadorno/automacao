import { promises as fs } from "fs";
import path from "path";

export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Load and parse a curl command from a file
 */
export async function loadCurl(curlPath: string): Promise<ParsedCurl> {
  const abs = path.resolve(curlPath);
  const raw = await fs.readFile(abs, "utf-8");
  return parseCurl(raw);
}

/**
 * Parse a curl command string into structured data
 */
export function parseCurl(curlCommand: string): ParsedCurl {
  const normalized = curlCommand
    .replace(/\\\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let url = "";
  let method = "GET";
  const headers: Record<string, string> = {};
  let body: string | undefined;

  // Extract URL - support multiple formats
  const urlMatch = normalized.match(/--url\s+(\S+)/) || 
                   normalized.match(/curl\s+['"]([^'"]+)['"]/) ||
                   normalized.match(/curl\s+(\S+)/);
  if (urlMatch) {
    url = urlMatch[1];
  }

  // Extract method - support both -X and --request
  const methodMatch = normalized.match(/--request\s+(\w+)/i) || 
                      normalized.match(/-X\s+(\w+)/i);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
  }

  // Extract headers - support both -H and --header
  const headerMatches = normalized.matchAll(/(?:--header|-H)\s+['"]([^'"]+)['"]/gi);
  for (const match of headerMatches) {
    const headerLine = match[1];
    const colonIndex = headerLine.indexOf(":");
    if (colonIndex > 0) {
      const key = headerLine.substring(0, colonIndex).trim();
      const value = headerLine.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  // Extract body - support --data, --data-raw, --data-binary, -d
  const dataMatch = normalized.match(/(?:--data(?:-raw|-binary)?|-d)\s+['"](.+)['"]/is);
  if (dataMatch) {
    body = dataMatch[1];
  }

  return { url, method, headers, body };
}

/**
 * Replace variables in curl command with actual values
 */
export function interpolateCurl(parsed: ParsedCurl, variables: Record<string, unknown>): ParsedCurl {
  const interpolate = (str: string): string => {
    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  };

  return {
    url: interpolate(parsed.url),
    method: parsed.method,
    headers: Object.fromEntries(
      Object.entries(parsed.headers).map(([k, v]) => [k, interpolate(v)])
    ),
    body: parsed.body ? interpolate(parsed.body) : undefined
  };
}
