# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Frank: an MCP server plus a Cloudscape web console, shipped as **one container** to Azure Container Apps. It is also the classroom for a one-day course, so `server/` and `ui/` start **empty on purpose**. Agents build them from the ADRs in `docs/adr/`. Treat the ADRs as the spec: read the relevant ADR before writing code, and follow it rather than your defaults.

`docs/adr/README.md` is the index of ADRs and their status. Accepted ADRs are immutable, and only the Status line may change to record supersession. To change a decision, write a new ADR that supersedes it (ADR-000). Rejected ADRs such as ADR-007 are kept for their reasoning and are **not** to be implemented.

## Commands

Each of `server/` and `ui/` is a self-contained npm package on Node 22+ (ADR-001, ADR-003). Once they are scaffolded, run these inside each one:

```bash
npm ci
npm run dev
npm test
npm run build
```

Local end-to-end build of the single image, run from the **repo root** (the build context must be the root so it can reach `ui/`):

```bash
docker build -t frank . && docker run -p 3000:3000 frank
```

## Architecture (the part spread across several files)

- **Server (ADR-001):** TypeScript and the official `@modelcontextprotocol/sdk` over **Streamable HTTP**, served by Express. There is no hand-written protocol code and no stdio transport. The routes are `POST /mcp` for MCP, `GET /healthz` for health, and `/` for the built console. All config comes from environment variables. `PORT` defaults to 3000, and it must match the Dockerfile's `PORT`/`EXPOSE` and `--target-port 3000` in `deploy.yml`.
- **Expected server layout** (referenced by the Dockerfile, the skill and the agents): `src/index.ts` is the entry point (compiled to `dist/index.js`), `src/app.ts` builds the Express app, and `src/config.ts` holds the zod-validated env config. `config.ts` resolves the console as `<package root>/public`. Tools go in `src/tools/`, one module per tool, with `define.ts` and `index.ts` as the registry. Tests go in `test/`.
- **Console (ADR-003 as amended by ADR-006):** React 18, Vite and Cloudscape components only, with no other component library and no custom CSS beyond layout glue. It is served **by Frank** and calls `/mcp` **relatively**, so there is no `VITE_FRANK_URL` and no CORS. It has two pages: Overview (`get_status` plus connection health) and Tools (MCP discovery, with a form rendered from each tool's input schema). The UI holds no secrets. The console is **optional**: `app.ts` must handle a missing console at `/`, and the Dockerfile builds `ui/` only if `ui/package.json` exists.
- **Tests are the deploy gate.** The root multi-stage `Dockerfile` runs `npm test && npm run build` for both packages. On `main` the image build is the only build and test. A red suite fails the build and nothing deploys.
- **Pipeline (`.github/workflows/deploy.yml`):** PRs build and test `server/` and `ui/` only. Each job skips with a notice until that package has a committed `package-lock.json`. A push to `main` (or `workflow_dispatch`) deploys: it fetches the shared classroom credential from `CREDENTIAL_URL` (ADR-010), runs `az acr build`, then `az containerapp create`/`update`. The app name is `frank-<github owner>`. Do **not** switch to `az containerapp up --source`, which crashes on some azure-cli builds (ADR-006).
- **Frank's Azure access (ADR-010):** at runtime Frank reads Azure with the same credential that deployed him. `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (a Container Apps secretref), `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` and `AZURE_RESOURCE_GROUP` are injected for `DefaultAzureCredential`. The resource group comes from the environment at boot and is **never a tool parameter**, so a caller cannot redirect Frank's scope. `/mcp` is deliberately unauthenticated (ADR-007 was rejected), and this is part of why.

## MCP tool rules (ADR-002). These are policy, not style.

- Names are `verb_noun` in lower snake_case, and the verb comes **only** from `get`, `list`, `search` or `summarize`. A `create_`/`update_`/`delete_`/`run_` tool needs a superseding ADR, not code.
- **Read-only:** no tool may change Azure, GitHub, or the filesystem beyond temp space.
- Inputs are strict zod schemas (unknown fields rejected), and every parameter is described. Outputs are JSON with a top-level `summary` string plus typed fields. Errors return `isError: true` with a plain-language message and never a stack trace.
- The first tool is `get_status`, returning version, uptime and a greeting.
- Every tool is registered in `server/src/tools/index.ts` and has a test under `server/test/`.

## Team config in `.claude/`

- `/adr <title>` scaffolds the next-numbered ADR from `docs/adr/template.md` with Status Proposed. It updates the ADR tables in **both** `docs/adr/README.md` and `README.md`, and runs the `adr-reviewer` agent. Leave new ADRs uncommitted: accepting one is a human's decision. Keep ADRs to one page, about 290–375 words.
- Before accepting an ADR, run the `adr-reviewer` agent. After adding or changing tools in `server/src/tools/`, run `tool-conventions`. Before committing or opening a PR, run `secret-scanner`. Delegate to these by name, because routing by description alone is not reliable.
- The `frank-tools` skill restates ADR-002 for tool work.

## Constraints

- Never commit or paste the classroom credential, and never write its value into `CLAUDE.md`, an ADR or a fixture. The committed `CREDENTIAL_URL` is the channel, deliberately (ADR-010). In workflow `run:` steps, read secrets through `env:` bindings rather than expanding `${{ }}` inline.
- Pushing to `main` deploys to Azure. Work on a branch and open a PR.
