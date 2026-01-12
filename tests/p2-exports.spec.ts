/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { applyExports } from "../src/core/exports";
import { Context } from "../src/core/context";
import { ExportRule } from "../src/core/types";

describe("P2 exports from response text", () => {
  it("extracts via regex", () => {
    const context: Context = {};
    const rules: Record<string, ExportRule> = {
      pedidoId: { source: "responseText", regex: "\"id\"\\s*:\\s*\"(\\w+)\"" }
    };
    applyExports(context, rules, { responseText: "{\"id\":\"abc\"}" });
    expect(context.pedidoId).toBe("abc");
  });

  it("extracts via jsonPath", () => {
    const context: Context = {};
    const rules: Record<string, ExportRule> = {
      pedidoId: { source: "responseText", jsonPath: "id" }
    };
    applyExports(context, rules, { responseText: "{\"id\":\"xyz\"}" });
    expect(context.pedidoId).toBe("xyz");
  });

  it("extracts from stdout via regex", () => {
    const context: Context = {};
    const rules: Record<string, ExportRule> = {
      total: { source: "stdout", regex: "total=(\\d+)" }
    };
    applyExports(context, rules, { stdout: "total=5\n" });
    expect(context.total).toBe("5");
  });
});
