import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// client.callTool()'s return type also covers task-based results, which have
// no `content` field. Frank's tools are all synchronous, so this should
// always be true — callers still check it before treating a result as one.
export function hasContent(result: unknown): result is CallToolResult {
  return (
    typeof result === "object" &&
    result !== null &&
    Array.isArray((result as { content?: unknown }).content)
  );
}

// Frank's tools return their JSON payload as a single text content block
// (ADR-002: a top-level `summary` plus typed fields).
export function extractResultText(result: CallToolResult): string {
  for (const item of result.content) {
    if (item.type === "text") {
      return item.text;
    }
  }
  return "";
}

export function describeToolError(result: CallToolResult): string {
  return extractResultText(result) || "The tool call failed.";
}
