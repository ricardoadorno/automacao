/// <reference types="vitest" />
import { describe, expect, it, vi } from "vitest";
import { executeSwaggerStep } from "../src/domains/api/swagger";
import { PlanStep } from "../src/core/types";

vi.mock("playwright", () => {
  return {
    chromium: {
      launch: async () => {
        return {
          newPage: async () => ({
            goto: async () => undefined,
            screenshot: async () => undefined,
            textContent: async () => "{\"id\": \"abc\"}"
          }),
          close: async () => undefined
        };
      }
    }
  };
});

describe("P3 OpenAPI validation", () => {
  it("fails when operationId does not exist", async () => {
    const step: PlanStep = {
      type: "swagger",
      behaviorId: "swagger",
      config: { operationId: "missing" }
    };
    const openapi = { paths: { "/ok": { get: { operationId: "exists" } } } };

    await expect(executeSwaggerStep(step, [], openapi, ".")).rejects.toThrow("operationId not found");
  });

  it("captures response text when selector is provided", async () => {
    const step: PlanStep = {
      type: "swagger",
      behaviorId: "swagger",
      config: { path: "/ok", method: "get", responseSelector: "#resp" }
    };
    const openapi = { paths: { "/ok": { get: { operationId: "exists" } } } };

    const result = await executeSwaggerStep(step, [], openapi, ".");
    expect(result.responseText).toBe("{\"id\": \"abc\"}");
  });
});
