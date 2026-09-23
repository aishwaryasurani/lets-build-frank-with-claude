import { describe, expect, it } from "vitest";
import { getStatus } from "../src/tools/get-status.js";

describe("get_status", () => {
  it("returns a summary plus typed detail fields (ADR-002)", async () => {
    const output = await getStatus.handler({});

    expect(typeof output.summary).toBe("string");
    expect(output.summary.length).toBeGreaterThan(0);
    expect(typeof output.version).toBe("string");
    expect(typeof output.uptimeSeconds).toBe("number");
    expect(output.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(typeof output.greeting).toBe("string");
  });

  it("rejects unknown input fields", () => {
    const result = getStatus.inputSchema.safeParse({ nonsense: true });
    expect(result.success).toBe(false);
  });
});
