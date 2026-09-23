import { z } from "zod";
import { config } from "../config.js";
import { defineTool } from "./define.js";

const startedAt = Date.now();

// ADR-002: Frank's first tool, so the pipeline, client wiring, and UI can be
// proven before any Azure integration exists.
export const getStatus = defineTool({
  name: "get_status",
  description:
    "Returns Frank's version, how long he has been running, and a greeting. " +
    "Call this first to confirm Frank is reachable before calling any other tool.",
  inputSchema: z.strictObject({}),
  handler: () => {
    const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return {
      summary: `Frank v${config.version} has been up for ${uptimeSeconds}s.`,
      version: config.version,
      uptimeSeconds,
      greeting: "Hello, I'm Frank.",
    };
  },
});
