import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Overview } from "../src/pages/Overview";

const callToolMock = vi.fn();

vi.mock("../src/mcp/client", () => ({
  getMcpClient: () => Promise.resolve({ callTool: callToolMock }),
}));

describe("Overview", () => {
  beforeEach(() => {
    callToolMock.mockReset();
  });

  it("shows Frank's status once connected", async () => {
    callToolMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            summary: "Frank v0.1.0 has been up for 5s.",
            version: "0.1.0",
            uptimeSeconds: 5,
            greeting: "Hello, I'm Frank.",
          }),
        },
      ],
    });

    render(<Overview />);

    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("0.1.0")).toBeInTheDocument();
    expect(screen.getByText("5s")).toBeInTheDocument();
    expect(screen.getByText("Hello, I'm Frank.")).toBeInTheDocument();
  });

  it("shows an unreachable state when the call fails", async () => {
    callToolMock.mockRejectedValue(new Error("connection refused"));

    render(<Overview />);

    expect(await screen.findByText("Unreachable")).toBeInTheDocument();
    expect(screen.getByText("connection refused")).toBeInTheDocument();
  });
});
