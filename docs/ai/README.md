# AI Tooling for the Cypress Monorepo

This repo is AI-ready. The goal of these docs is to make **effective AI workflows
discoverable alongside the code**, with minimal process overhead.

> Note: Some references below point to Cypress-internal resources (e.g. AI Hub).
> These are optional background/context and are not required to contribute to this repository.
> All repo-local AI guidance should remain usable without access to internal systems.

## Canonical Source of Truth

Canonical workflows and patterns are curated in the AI Hub (internal reference):

- Patterns: https://aihub.cypress.io/patterns
- Playbooks: https://aihub.cypress.io/playbooks
- Tools (skills installer, etc.): https://aihub.cypress.io/tools
- Recordings / notes: https://aihub.cypress.io/forum
- Browse by tag: https://aihub.cypress.io/browse-by-tag

> If you improve a workflow/pattern materially, prefer capturing it in the Hub
> (PR-reviewed) and linking from here.

## Tool Entrypoints

### Claude Code CLI

[Docs](https://code.claude.com/docs/en/memory) — Claude Code walks **upward** from your
current working directory to the git root at launch, loading every `CLAUDE.md` it finds.

`CLAUDE.md` files in this repo:

```
CLAUDE.md                                    ← root (workflow rules + @AGENTS.md)
cli/CLAUDE.md                                ← cli workspace
cli/cypress/CLAUDE.md                        ← cypress main package
cli/angular/CLAUDE.md
cli/angular-zoneless/CLAUDE.md
cli/mount-utils/CLAUDE.md
cli/react/CLAUDE.md
cli/svelte/CLAUDE.md
cli/vue/CLAUDE.md
npm/CLAUDE.md                                ← npm workspace
npm/angular/CLAUDE.md
npm/angular-zoneless/CLAUDE.md
npm/eslint-plugin-dev/CLAUDE.md
npm/grep/CLAUDE.md
npm/mount-utils/CLAUDE.md
npm/puppeteer/CLAUDE.md
npm/react/CLAUDE.md
npm/schematic/CLAUDE.md
npm/svelte/CLAUDE.md
npm/vite-dev-server/CLAUDE.md
npm/vite-plugin-cypress-esm/CLAUDE.md
npm/vue/CLAUDE.md
npm/webpack-batteries-included-preprocessor/CLAUDE.md
npm/webpack-dev-server/CLAUDE.md
npm/webpack-preprocessor/CLAUDE.md
packages/CLAUDE.md                           ← packages workspace
packages/app/CLAUDE.md
packages/config/CLAUDE.md
packages/data-context/CLAUDE.md
packages/driver/CLAUDE.md
packages/electron/CLAUDE.md
packages/errors/CLAUDE.md
packages/eslint-config/CLAUDE.md
packages/extension/CLAUDE.md
packages/frontend-shared/CLAUDE.md
packages/https-proxy/CLAUDE.md
packages/icons/CLAUDE.md
packages/launcher/CLAUDE.md
packages/launchpad/CLAUDE.md
packages/net-stubbing/CLAUDE.md
packages/network/CLAUDE.md
packages/network-tools/CLAUDE.md
packages/packherd-require/CLAUDE.md
packages/proxy/CLAUDE.md
packages/reporter/CLAUDE.md
packages/resolve-dist/CLAUDE.md
packages/rewriter/CLAUDE.md
packages/root/CLAUDE.md
packages/runner/CLAUDE.md
packages/scaffold-config/CLAUDE.md
packages/server/CLAUDE.md
packages/socket/CLAUDE.md
packages/stderr-filtering/CLAUDE.md
packages/telemetry/CLAUDE.md
packages/ts/CLAUDE.md
packages/types/CLAUDE.md
packages/v8-snapshot-require/CLAUDE.md
packages/web-config/CLAUDE.md
tooling/CLAUDE.md                            ← tooling workspace
tooling/electron-mksnapshot/CLAUDE.md
tooling/packherd/CLAUDE.md
tooling/v8-snapshot/CLAUDE.md
system-tests/CLAUDE.md
scripts/CLAUDE.md
```

Each `CLAUDE.md` (except the root) is a thin wrapper — title heading + `@AGENTS.md`.
All substantive content lives in the sibling `AGENTS.md`. This keeps `CLAUDE.md` files
minimal while making them self-documenting via the import.

---

### Codex CLI

[Docs](https://developers.openai.com/codex/guides/agents-md/) — Codex walks **downward**
from the git root to your current working directory, concatenating `AGENTS.md` files
root-first (32 KiB limit total).

`AGENTS.md` files in this repo mirror the `CLAUDE.md` list above, with the same paths
but `AGENTS.md` filename instead. The root `AGENTS.md` provides full project context;
workspace and package `AGENTS.md` files add scoped detail.

---

### Cursor

[Docs](https://cursor.com/docs/context/rules) — Cursor reads `.cursor/rules/*.mdc` and
natively reads `AGENTS.md` files.

Existing Cursor rules in this repo:

- `.cursor/BUGBOT.md` — PR review checklist (security, performance, Cypress-specific rules)
- `packages/electron/.cursor/rules/electron-upgrade.mdc` — Electron upgrade guide

| Type | Frontmatter | When active |
| --- | --- | --- |
| Always Apply | `alwaysApply: true` | Every session |
| Specific Files | `globs: ["app/**"]` | When editing a matching file |
| Agent-requested | `description: "..."` only | Agent decides based on description |
| Manual | none | Only when mentioned via `@rule-name` in chat |

---

## Why AGENTS.md Is the Single Source of Truth

Cursor and Codex read `AGENTS.md` natively; Claude Code reads it via `@import`. One edit
propagates to all three tools. The only separately-maintained content is the workflow
orchestration section in root `CLAUDE.md` — that is Claude Code-specific and intentionally
kept separate.

## Contributing

Hub contributions are preferred for canonical patterns and playbooks. Repo-local scaffolds
(`AGENTS.md` / `CLAUDE.md`) should stay minimal — factual descriptions of what exists,
not aspirational guides.

If you add a new package to the monorepo, add a `CLAUDE.md` and `AGENTS.md` alongside
it following the patterns in existing packages.

When repo structure, commands, or conventions change, update the relevant `AGENTS.md` /
`CLAUDE.md` files in the same PR (similar to keeping READMEs accurate).
