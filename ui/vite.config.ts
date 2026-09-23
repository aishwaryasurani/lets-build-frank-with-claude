/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// ADR-006: no VITE_FRANK_URL and no CORS — the console is served by Frank at
// `/` and calls `/mcp` relatively, so there is nothing to configure here for
// talking to Frank. This config only wires up the React plugin and Vitest.
export default defineConfig({
  plugins: [react()],
  // Dev-time only: `npm run dev` here serves the console on its own port, so
  // relative /mcp calls need somewhere to go. This proxies to `npm run dev`
  // in server/ on its default PORT — it never ships in the production build,
  // where Frank serves both from one origin.
  server: {
    proxy: {
      "/mcp": "http://localhost:3000",
      "/healthz": "http://localhost:3000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
