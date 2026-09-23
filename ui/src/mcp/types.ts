// A minimal, defensive view of the JSON Schema Frank's tools/list returns for
// each tool's input schema (ADR-002 requires zod on the server; MCP discovery
// exposes it to clients as JSON Schema).
export interface JsonSchemaProperty {
  type?: string;
  description?: string;
  enum?: Array<string | number>;
  default?: unknown;
}

export interface ObjectSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export interface DiscoveredTool {
  name: string;
  description?: string;
  inputSchema: ObjectSchema;
}
