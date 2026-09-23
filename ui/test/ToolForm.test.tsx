import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolForm } from "../src/components/ToolForm";
import type { DiscoveredTool } from "../src/mcp/types";

const callToolMock = vi.fn();

vi.mock("../src/mcp/client", () => ({
  getMcpClient: () => Promise.resolve({ callTool: callToolMock }),
}));

describe("ToolForm", () => {
  beforeEach(() => {
    callToolMock.mockReset();
  });

  it("calls a no-input tool and shows the JSON result", async () => {
    callToolMock.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ summary: "ok" }) }],
    });

    const tool: DiscoveredTool = {
      name: "get_status",
      description: "Returns status.",
      inputSchema: { type: "object", properties: {}, required: [] },
    };

    render(<ToolForm tool={tool} />);

    expect(screen.getByText("This tool takes no input.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Call tool" }));

    await waitFor(() => {
      expect(callToolMock).toHaveBeenCalledWith({ name: "get_status", arguments: {} });
    });

    await screen.findByText((_content, element) => element?.textContent === '{"summary":"ok"}');
  });

  it("requires a required field without calling Frank", async () => {
    const tool: DiscoveredTool = {
      name: "get_widget",
      description: "Returns a widget.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Widget id" } },
        required: ["id"],
      },
    };

    render(<ToolForm tool={tool} />);
    fireEvent.click(screen.getByRole("button", { name: "Call tool" }));

    await screen.findByText('"id" is required.');
    expect(callToolMock).not.toHaveBeenCalled();
  });

  it("shows a plain-language message when the tool call errors (ADR-002)", async () => {
    callToolMock.mockResolvedValue({
      content: [{ type: "text", text: "Frank could not reach Azure." }],
      isError: true,
    });

    const tool: DiscoveredTool = {
      name: "get_status",
      description: "Returns status.",
      inputSchema: { type: "object", properties: {}, required: [] },
    };

    render(<ToolForm tool={tool} />);
    fireEvent.click(screen.getByRole("button", { name: "Call tool" }));

    await screen.findByText("Frank could not reach Azure.");
  });
});
