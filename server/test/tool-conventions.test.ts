import { describe, expect, it } from "vitest";
import { toolDefinitions } from "../src/tools/index.js";

// ADR-002: verb_noun naming from a closed verb set, every tool described.
const ALLOWED_VERBS = new Set(["get", "list", "search", "summarize"]);

describe("tool conventions (ADR-002)", () => {
  it("has at least one tool registered", () => {
    expect(toolDefinitions.length).toBeGreaterThan(0);
  });

  it("ships get_status first", () => {
    expect(toolDefinitions[0]?.name).toBe("get_status");
  });

  it("names every tool verb_noun with a verb from the closed set", () => {
    for (const tool of toolDefinitions) {
      expect(tool.name).toMatch(/^[a-z]+(?:_[a-z]+)+$/);
      const verb = tool.name.split("_")[0];
      expect(ALLOWED_VERBS.has(verb ?? "")).toBe(true);
    }
  });

  it("describes every tool for a model deciding whether to call it", () => {
    for (const tool of toolDefinitions) {
      expect(tool.description.trim().length).toBeGreaterThan(0);
    }
  });
});
