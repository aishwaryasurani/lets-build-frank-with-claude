import type { Server } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("Frank's Express app (ADR-001)", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createApp().listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("expected an ephemeral TCP address");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("answers GET /healthz for container health probes", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("serves a plain notice at / when the console has not been built", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/console has not been built/i);
  });

  it("rejects GET and DELETE on /mcp", async () => {
    const getRes = await fetch(`${baseUrl}/mcp`);
    expect(getRes.status).toBe(405);

    const deleteRes = await fetch(`${baseUrl}/mcp`, { method: "DELETE" });
    expect(deleteRes.status).toBe(405);
  });

  it("discovers and calls get_status over MCP Streamable HTTP", async () => {
    const client = new Client({ name: "frank-test-client", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);

    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toContain("get_status");

      const result = await client.callTool({ name: "get_status", arguments: {} });
      expect(result.isError).not.toBe(true);

      const [first] = result.content as Array<{ type: string; text?: string }>;
      const payload = JSON.parse(first?.text ?? "{}") as { summary?: unknown };
      expect(typeof payload.summary).toBe("string");
    } finally {
      await client.close();
    }
  });

  it("rejects unknown fields on a tool call (ADR-002)", async () => {
    const client = new Client({ name: "frank-test-client", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);

    try {
      const result = await client.callTool({ name: "get_status", arguments: { nonsense: true } });
      expect(result.isError).toBe(true);

      const [first] = result.content as Array<{ type: string; text?: string }>;
      expect(first?.text).not.toMatch(/at .*\(.*:\d+:\d+\)/); // no stack trace (ADR-002)
    } finally {
      await client.close();
    }
  });
});
