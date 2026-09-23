import { useEffect, useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Spinner from "@cloudscape-design/components/spinner";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { getMcpClient } from "../mcp/client";
import { describeToolError, extractResultText, hasContent } from "../mcp/result";

interface FrankStatus {
  summary: string;
  version: string;
  uptimeSeconds: number;
  greeting: string;
}

type Health =
  | { kind: "loading" }
  | { kind: "connected"; status: FrankStatus }
  | { kind: "unreachable"; message: string };

// ADR-003: Frank's get_status output, plus connection health.
export function Overview() {
  const [health, setHealth] = useState<Health>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      try {
        const client = await getMcpClient();
        const result = await client.callTool({ name: "get_status", arguments: {} });
        if (cancelled) {
          return;
        }
        if (!hasContent(result)) {
          throw new Error("Frank returned a task-based result, which this console does not support.");
        }
        if (result.isError) {
          setHealth({ kind: "unreachable", message: describeToolError(result) });
          return;
        }
        const status = JSON.parse(extractResultText(result)) as FrankStatus;
        setHealth({ kind: "connected", status });
      } catch (error) {
        if (!cancelled) {
          setHealth({
            kind: "unreachable",
            message: error instanceof Error ? error.message : "Could not reach Frank.",
          });
        }
      }
    }

    void checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="Frank's current status and connection health.">
        Overview
      </Header>

      <Container header={<Header variant="h2">Connection</Header>}>
        {health.kind === "loading" && (
          <Box>
            <Spinner /> Checking connection to Frank…
          </Box>
        )}
        {health.kind === "connected" && (
          <StatusIndicator type="success">Connected</StatusIndicator>
        )}
        {health.kind === "unreachable" && (
          <StatusIndicator type="error">Unreachable</StatusIndicator>
        )}
      </Container>

      {health.kind === "unreachable" && (
        <Alert type="error" header="Could not reach Frank">
          {health.message}
        </Alert>
      )}

      {health.kind === "connected" && (
        <Container header={<Header variant="h2">get_status</Header>}>
          <KeyValuePairs
            columns={3}
            items={[
              { label: "Version", value: health.status.version },
              { label: "Uptime", value: `${health.status.uptimeSeconds}s` },
              { label: "Greeting", value: health.status.greeting },
            ]}
          />
        </Container>
      )}
    </SpaceBetween>
  );
}
