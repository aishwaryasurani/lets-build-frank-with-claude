import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// ADR-001: all settings come from environment variables, no config files with
// values in them. PORT must match the Dockerfile's PORT/EXPOSE and deploy.yml's
// --target-port.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const env = envSchema.parse(process.env);

// dist/config.js sits one level below the package root at build time, and so
// does src/config.ts under tsx in dev — both resolve the same package root.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const pkg = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8")) as {
  version: string;
};

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  version: pkg.version,
  // The Dockerfile copies the built console to <package root>/public. The
  // console is optional (ADR-003): app.ts checks this exists before serving it.
  consoleDir: path.join(packageRoot, "public"),
};
