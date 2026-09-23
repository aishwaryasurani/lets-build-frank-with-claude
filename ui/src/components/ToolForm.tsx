import { useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { getMcpClient } from "../mcp/client";
import { describeToolError, extractResultText, hasContent } from "../mcp/result";
import type { DiscoveredTool } from "../mcp/types";

type FieldValue = string | boolean | undefined;

type CallState =
  | { kind: "idle" }
  | { kind: "calling" }
  | { kind: "success"; text: string }
  | { kind: "error"; message: string };

function isNumeric(type: string | undefined): boolean {
  return type === "number" || type === "integer";
}

// Renders a form from a tool's JSON Schema input (ADR-003): new tools show up
// here with zero UI work, the payoff of ADR-002's schema discipline.
export function ToolForm({ tool }: { tool: DiscoveredTool }) {
  const properties = tool.inputSchema.properties ?? {};
  const required = new Set(tool.inputSchema.required ?? []);
  const fieldNames = Object.keys(properties);

  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    const initial: Record<string, FieldValue> = {};
    for (const name of fieldNames) {
      const property = properties[name];
      if (property?.type === "boolean") {
        initial[name] = Boolean(property.default ?? false);
      } else if (property?.default !== undefined) {
        initial[name] = String(property.default);
      }
    }
    return initial;
  });
  const [state, setState] = useState<CallState>({ kind: "idle" });

  function setValue(name: string, value: FieldValue) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit() {
    setState({ kind: "calling" });
    try {
      const args: Record<string, unknown> = {};
      for (const name of fieldNames) {
        const value = values[name];
        const property = properties[name];
        if (value === undefined || value === "") {
          if (required.has(name)) {
            throw new Error(`"${name}" is required.`);
          }
          continue;
        }
        args[name] = isNumeric(property?.type) ? Number(value) : value;
      }

      const client = await getMcpClient();
      const result = await client.callTool({ name: tool.name, arguments: args });
      if (!hasContent(result)) {
        throw new Error("Frank returned a task-based result, which this console does not support.");
      }
      if (result.isError) {
        setState({ kind: "error", message: describeToolError(result) });
        return;
      }
      setState({ kind: "success", text: extractResultText(result) });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "The call failed.",
      });
    }
  }

  return (
    <SpaceBetween size="m">
      <Form
        actions={
          <Button variant="primary" loading={state.kind === "calling"} onClick={handleSubmit}>
            Call tool
          </Button>
        }
      >
        <SpaceBetween size="m">
          {fieldNames.length === 0 && (
            <Box color="text-body-secondary">This tool takes no input.</Box>
          )}
          {fieldNames.map((name) => {
            const property = properties[name] ?? {};
            const label = required.has(name) ? `${name} (required)` : name;

            if (property.enum) {
              const currentValue = values[name];
              return (
                <FormField key={name} label={label} description={property.description}>
                  <Select
                    selectedOption={
                      currentValue !== undefined
                        ? { label: String(currentValue), value: String(currentValue) }
                        : null
                    }
                    onChange={(event) => setValue(name, event.detail.selectedOption.value)}
                    options={property.enum.map((option) => ({
                      label: String(option),
                      value: String(option),
                    }))}
                    placeholder="Choose an option"
                  />
                </FormField>
              );
            }

            if (property.type === "boolean") {
              return (
                <FormField key={name} label={label} description={property.description}>
                  <Checkbox
                    checked={Boolean(values[name])}
                    onChange={(event) => setValue(name, event.detail.checked)}
                  >
                    {name}
                  </Checkbox>
                </FormField>
              );
            }

            return (
              <FormField key={name} label={label} description={property.description}>
                <Input
                  value={values[name] !== undefined ? String(values[name]) : ""}
                  inputMode={isNumeric(property.type) ? "decimal" : undefined}
                  onChange={(event) => setValue(name, event.detail.value)}
                />
              </FormField>
            );
          })}
        </SpaceBetween>
      </Form>
      {state.kind === "error" && (
        <Alert type="error" header="Tool call failed">
          {state.message}
        </Alert>
      )}
      {state.kind === "success" && (
        <Box>
          <Box variant="awsui-key-label">Result</Box>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{state.text}</pre>
        </Box>
      )}
    </SpaceBetween>
  );
}
