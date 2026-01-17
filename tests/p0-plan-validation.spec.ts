import { describe, expect, it } from "vitest";
import { validatePlanStructure } from "../src/core/plan-validator";

describe("plan validation", () => {
  it("flags missing metadata and steps", () => {
    const errors = validatePlanStructure({ steps: [] });
    const paths = errors.map((error) => error.path);
    expect(paths).toContain("metadata");
  });

  it("requires behaviorId and behaviorsPath for browser steps", () => {
    const errors = validatePlanStructure({
      metadata: { feature: "Browser flow" },
      steps: [{ type: "browser" }]
    });
    const paths = errors.map((error) => error.path);
    expect(paths).toContain("steps[0].behaviorId");
    expect(paths).toContain("behaviorsPath");
  });

  it("requires curlPath for api steps", () => {
    const errors = validatePlanStructure({
      metadata: { feature: "API flow" },
      steps: [{ type: "api" }]
    });
    const paths = errors.map((error) => error.path);
    expect(paths).toContain("curlPath");
  });
});
