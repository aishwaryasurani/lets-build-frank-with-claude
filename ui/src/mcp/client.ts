import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// ADR-006: the console is served by Frank and calls /mcp relatively — no
// VITE_FRANK_URL, no CORS, because there is no cross-origin request.
let connection: Promise<Client> | undefined;

function connect(): Promise<Client> {
  const client = new Client({ name: "frank-console", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL("/mcp", window.location.origin));
  return client.connect(transport).then(() => client);
}

export function getMcpClient(): Promise<Client> {
  connection ??= connect().catch((error: unknown) => {
    connection = undefined;
    throw error;
  });
  return connection;
}
