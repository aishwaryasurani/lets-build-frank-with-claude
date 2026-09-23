import { useEffect, useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Spinner from "@cloudscape-design/components/spinner";
import Table from "@cloudscape-design/components/table";
import { ToolForm } from "../components/ToolForm";
import { getMcpClient } from "../mcp/client";
import type { DiscoveredTool } from "../mcp/types";

type Discovery =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; tools: DiscoveredTool[] };

// ADR-003: the tool list from MCP discovery; selecting a tool renders a form
// from its input schema and shows the JSON result.
export function Tools() {
  const [discovery, setDiscovery] = useState<Discovery>({ kind: "loading" });
  const [selectedName, setSelectedName] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function discover() {
      try {
        const client = await getMcpClient();
        const { tools } = await client.listTools();
        if (cancelled) {
          return;
        }
        const discovered = tools as unknown as DiscoveredTool[];
        setDiscovery({ kind: "ready", tools: discovered });
        setSelectedName((current) => current ?? discovered[0]?.name);
      } catch (error) {
        if (!cancelled) {
          setDiscovery({
            kind: "error",
            message: error instanceof Error ? error.message : "Could not reach Frank.",
          });
        }
      }
    }

    void discover();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTool =
    discovery.kind === "ready" ? discovery.tools.find((tool) => tool.name === selectedName) : undefined;

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="Tools Frank exposes over MCP. Select one to call it.">
        Tools
      </Header>

      {discovery.kind === "loading" && (
        <Box>
          <Spinner /> Discovering tools…
        </Box>
      )}

      {discovery.kind === "error" && (
        <Alert type="error" header="Could not discover tools">
          {discovery.message}
        </Alert>
      )}

      {discovery.kind === "ready" && (
        <Grid gridDefinition={[{ colspan: { default: 12, xs: 5 } }, { colspan: { default: 12, xs: 7 } }]}>
          <Table
            variant="embedded"
            trackBy="name"
            columnDefinitions={[
              { id: "name", header: "Name", cell: (item) => item.name },
              { id: "description", header: "Description", cell: (item) => item.description ?? "" },
            ]}
            items={discovery.tools}
            selectionType="single"
            selectedItems={selectedTool ? [selectedTool] : []}
            onSelectionChange={(event) => setSelectedName(event.detail.selectedItems[0]?.name)}
            empty="Frank has no tools registered."
          />
          <Container header={<Header variant="h2">{selectedTool?.name ?? "Select a tool"}</Header>}>
            {selectedTool ? (
              <SpaceBetween size="m">
                {selectedTool.description && <Box>{selectedTool.description}</Box>}
                <ToolForm key={selectedTool.name} tool={selectedTool} />
              </SpaceBetween>
            ) : (
              <Box color="text-body-secondary">Select a tool to call it.</Box>
            )}
          </Container>
        </Grid>
      )}
    </SpaceBetween>
  );
}
