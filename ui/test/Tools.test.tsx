import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Tools } from "../src/pages/Tools";

const listToolsMock = vi.fn();
const callToolMock = vi.fn();

vi.mock("../src/mcp/client", () => ({
  getMcpClient: () => Promise.resolve({ listTools: listToolsMock, callTool: callToolMock }),
}));

describe("Tools", () => {
  beforeEach(() => {
    listToolsMock.mockReset();
    callToolMock.mockReset();
  });

  it("discovers tools and renders the first tool's form (ADR-003)", async () => {
    listToolsMock.mockResolvedValue({
      tools: [
        {
          name: "get_status",
          description: "Returns status.",
          inputSchema: { type: "object", properties: {}, required: [] },
        },
        {
          name: "list_things",
          description: "Lists things.",
          inputSchema: { type: "object", properties: {}, required: [] },
        },
      ],
    });

    render(<Tools />);

    expect(await screen.findByRole("heading", { name: "get_status" })).toBeInTheDocument();
    expect(screen.getByText("list_things")).toBeInTheDocument();
    expect(screen.getByText("This tool takes no input.")).toBeInTheDocument();
  });

  it("shows a discovery error", async () => {
    listToolsMock.mockRejectedValue(new Error("no route to host"));

    render(<Tools />);

    expect(await screen.findByText("Could not discover tools")).toBeInTheDocument();
    expect(screen.getByText("no route to host")).toBeInTheDocument();
  });
});
