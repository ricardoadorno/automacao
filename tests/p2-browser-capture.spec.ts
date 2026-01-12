/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { buildTileOffsets } from "../src/domains/browser/capture";

describe("P2 browser capture tiling", () => {
  it("builds offsets when content fits viewport", () => {
    expect(buildTileOffsets(600, 800, 0)).toEqual([0]);
  });

  it("builds offsets with overlap", () => {
    expect(buildTileOffsets(2000, 800, 100)).toEqual([0, 700, 1200]);
  });

  it("builds offsets without overlap", () => {
    expect(buildTileOffsets(1900, 800, 0)).toEqual([0, 800, 1100]);
  });
});
