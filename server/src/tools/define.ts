import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

/**
 * Every tool's output is JSON with a top-level `summary` plus typed detail
 * fields (ADR-002) — the `summary` is what a model reads without parsing the
 * rest.
 */
export interface ToolOutput {
  summary: string;
  [field: string]: unknown;
}

export interface ToolDefinition<Schema extends z.ZodTypeAny = z.ZodTypeAny> {
  /** verb_noun, lower snake_case, verb from get/list/search/summarize (ADR-002). */
  name: string;
  /** One or two sentences for a model deciding whether to call this tool. */
  description: string;
  /** A strict zod object schema — unknown fields are rejected (ADR-002). */
  inputSchema: Schema;
  handler: (input: z.infer<Schema>) => ToolOutput | Promise<ToolOutput>;
}

export function defineTool<Schema extends z.ZodTypeAny>(
  definition: ToolDefinition<Schema>,
): ToolDefinition<Schema> {
  return definition;
}

export function toCallToolResult(output: ToolOutput): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
  };
}

// ADR-002: errors carry a plain-language message and isError: true — never a
// stack trace.
export function toErrorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
