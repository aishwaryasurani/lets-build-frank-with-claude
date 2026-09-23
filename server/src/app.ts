import fs from "node:fs";
import type { Request, Response } from "express";
import express, { type Express } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { registerTools } from "./tools/index.js";

function buildMcpServer(): McpServer {
  const server = new McpServer({ name: "frank", version: config.version });
  registerTools(server);
  return server;
}

function methodNotAllowed(_req: Request, res: Response): void {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
}

// ADR-001: Express app with POST /mcp for MCP (Streamable HTTP), GET /healthz
// for container health probes, and / for the built console.
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Stateless per ADR-002's read-only rule: Frank keeps no session state, so a
  // fresh MCP server and transport are built for every request.
  app.post("/mcp", async (req, res) => {
    const server = buildMcpServer();
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });
  app.get("/mcp", methodNotAllowed);
  app.delete("/mcp", methodNotAllowed);

  // The console is optional (ADR-003): it is built late in the class, and
  // Frank must deploy and serve MCP long before it exists.
  if (fs.existsSync(config.consoleDir)) {
    app.use(express.static(config.consoleDir));
  } else {
    app.get("/", (_req, res) => {
      res
        .status(200)
        .type("text/plain")
        .send("Frank is running. The console has not been built yet (ADR-003) — MCP is live at POST /mcp.");
    });
  }

  return app;
}
