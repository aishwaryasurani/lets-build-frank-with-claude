import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import { toCallToolResult, toErrorResult, type ToolDefinition } from "./define.js";
import { getStatus } from "./get-status.js";

// The tool registry (ADR-002): every tool Frank exposes is listed here, and
// every module lives under server/src/tools/. get_status is deliberately
// first.
export const toolDefinitions: ToolDefinition<z.ZodTypeAny>[] = [getStatus];

export function registerTools(server: McpServer): void {
  for (const tool of toolDefinitions) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      async (args) => {
        try {
          const output = await tool.handler(args);
          return toCallToolResult(output);
        } catch (error) {
          // ADR-002: plain-language message, never a stack trace.
          const message = error instanceof Error ? error.message : "Something went wrong.";
          return toErrorResult(message);
        }
      },
    );
  }
}
