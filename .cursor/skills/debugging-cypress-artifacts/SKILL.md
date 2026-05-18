---
name: debugging-cypress-artifacts
description: >-
  Debugs Cypress bugs that only reproduce in packaged artifacts (cli/build CLI
  plus binary-package output), not yarn dev. Covers the git commit/build/clean/
  reset debug loop, env -u ELECTRON_RUN_AS_NODE for binary-build on agent hosts,
  CYPRESS_RUN_BINARY, DEBUG and inspect flags, and workspace recovery without
  stash. Use when investigating artifact-only bugs, binary-build electron
  MODULE_NOT_FOUND, or a packaged cypress open/run repro loop.
---

# Debugging Cypress packaged artifacts

Some bugs only appear in **release-shaped** code: Rollup output under **`cli/build/`** (not `yarn dev`), plus the **packaged Electron app** from `binary-package` (not `scripts/start.js` / **`cypress open --dev`**).

Build steps: see [building-cypress-binary](../building-cypress-binary/SKILL.md).

## Agent execution (avoid repeated permission prompts)

Run this workflow **without asking the user to approve each command**. Use elevated permissions up front:

| Phase | Command pattern | Permissions |
|-------|-----------------|-------------|
| Install | `yarn` from repo root (if `node_modules/.bin/lerna` missing) | `network` |
| CLI build | `yarn lerna run build-cli --scope cypress` | `network` |
| Binary build | `env -u ELECTRON_RUN_AS_NODE yarn binary-build` / `binary-package` with `--version` / `--platform` | `all` (long-running, writes outside workspace temp dirs). **Unset `ELECTRON_RUN_AS_NODE`** — see building skill. |
| Repro / logs | `node cli/build/dist/bin/cypress …`, `node packages/server/index.js --version` | `network` if debug ingest uses HTTP |
| Cleanup | `git clean -xfd`, then `yarn` | `all` for clean; `network` for yarn |

Do **not** re-prompt for sandbox/network on every step in the same session once the user has asked for a full artifact debug loop.

## Git workflow for a debug loop (single checkout)

Binary builds use the **full tree** and leave the workspace unusable for normal dev (generated `.js` beside `.ts`, possible **`.ts` mutations**, `dist/`, root `build/` symlink, etc.). **Do not use `git stash push -a`** — stash mixes real WIP with binary cruft.

Use a **WIP commit** as a bookmark, then **reset** (not **`git revert`**) to restore edits after cleanup:

1. **`git checkout -b debug/<topic>`** (or stay on an existing debug branch).
2. **Analysis edits** (logging, temporary probes, etc.). Commit only what you mean — prefer **`git add <paths>`** over blind **`git commit -a`**, so build noise on tracked files is not swept into the WIP commit.
3. **`git commit -m "wip: debug …"`** if there are changes worth preserving (see **Husky** below if commit fails).
4. **Build** packaged CLI and binary (see building skill): `yarn lerna run build-cli --scope cypress`, then **`env -u ELECTRON_RUN_AS_NODE yarn binary-build`** / **`binary-package`** with matching **`--version`** (discover via `env -u ELECTRON_RUN_AS_NODE node packages/server/index.js --version`) and **`--platform`**.
5. **Repro** with packaged entrypoints (below).
6. **Restore workspace:**
   ```bash
   git clean -xfd && yarn
   ```
   Then either:
   - **`git reset HEAD~1`** (mixed, default) if step 3 succeeded — WIP commit becomes unstaged changes again; **not `git revert`**.
   - **`git restore --staged --worktree <paths>`** if there was **no WIP commit** (instrumentation-only files listed in step 2). Remove any temporary helper files (e.g. `packages/server/lib/util/debug-agent-log.js`) with `rm`.

7. Repeat from step 2.

**Rules:** Do not **`git reset HEAD~1`** after pushing that WIP commit unless you intend to rewrite remote history. Untracked files not in the WIP commit are **gone** after `git clean -xfd`. **`.cursor/skills/`** is gitignored except `!.cursor/skills` — skills survive `git clean -xfd`; other `.cursor/*` files may not.

**Husky:** If **`git commit`** fails with missing **`.husky/_/husky.sh`**, do not loop on commit. Proceed with staged instrumentation, then restore via **`git restore`** in step 6 (or fix Husky / run `yarn` so hooks install, then commit).

**Alternative:** a **separate git worktree** for binary-only work avoids the commit/reset dance; see the building skill’s reset section.

## Packaged CLI entrypoint

After **`yarn lerna run build-cli --scope cypress`**:

```bash
node <repo>/cli/build/dist/bin/cypress <command>
```

Rollup emits the instrumented entry at **`cli/build/dist/bin/cypress`**. **`cli/build/bin/cypress`** is a **thin copy** of `cli/bin/cypress` (loads `../dist/cli` via a different path) and is **not** the same as the Rollup bundle — do not use it for artifact or agent-log repro.

Prefer an absolute path when cwd might confuse postinstall-relative logic.

## Point the CLI at your packaged binary

```bash
export CYPRESS_RUN_BINARY=/path/to/platform/executable
```

Set the **real executable** (validated in `cli/lib/tasks/state.ts` via `realpath`), not the `.app` folder alone:

| OS | Example shape |
|----|----------------|
| macOS | `…/Cypress.app/Contents/MacOS/Cypress` |
| Linux | `…/Cypress` (unpacked binary) |
| win32 | `…/Cypress.exe` |

Align **CLI package version** with the **binary `--version`** used at build time when possible.

## Log and trace flags

- **`DEBUG=cypress:cli*`** — CLI install, verify, spawn.
- **`DEBUG=cypress:electron*`** — Electron install/open; CLI spawn also uses `cypress:electron`.
- **`ELECTRON_ENABLE_LOGGING=1`** — unfiltered Electron stderr (`packages/electron/src/open.ts`).
- Prefer scoped `DEBUG` patterns over **`DEBUG=cypress:*`**.

## Attach debuggers

- **CLI (Node):** `node --inspect-brk <repo>/cli/build/dist/bin/cypress <command>`
- **Electron main (packaged):** `node <repo>/cli/build/dist/bin/cypress open --inspect-brk` (or `--inspect`); forwarded in `cli/lib/exec/open.ts` / `run.ts`. Use with **`CYPRESS_RUN_BINARY`** so the debuggee is your local package output.

## Debug-session instrumentation (agents)

When using Cursor debug-mode HTTP ingest (`127.0.0.1:7709`, session log under **`.cursor/debug-<session>.log`**):

- **Entry layers** to tag: CLI bin → CLI `init` → CLI `spawn` (only when the binary is spawned, not for `version`) → `packages/server/index.js` (`startCypress`) → `packages/server/start-cypress.js`.
- **Short-lived CLI:** fire-and-forget `fetch` alone often loses events because the process exits first. Also **`appendFileSync`** the same NDJSON line to the session log path (or a small `debug-agent-log.js` helper on the server side) in addition to `fetch`.
- **Verify server layers** without a full green binary: `env -u ELECTRON_RUN_AS_NODE node packages/server/index.js --version` from `packages/server` (exercises index + start-cypress; **unset `ELECTRON_RUN_AS_NODE`** if the agent host sets it).
- **Verify CLI layers:** `node cli/build/dist/bin/cypress version` (does not hit spawn). CLI bin is unaffected by `ELECTRON_RUN_AS_NODE` for the version subcommand, but binary-build still needs the var unset.

## What to skip

- **`--dev`** on `open` / `run`
- Assuming **`yarn dev`** matches packaged behavior (`cli/lib/tasks/verify.ts` uses `scripts/start.js` when `dev` is true)

## Common workspace gotcha after `yarn`

If **`yarn`** / Vite fails on **`urqlSchema`** or **`urqlCacheKeys`** imports from `@packages/data-context`, stale **`packages/data-context/src/**/*.js`** files may be shadowing **`.ts`**. Regenerate (`yarn workspace @packages/data-context build`) and remove **`.js` siblings that have a matching `.ts`** under `packages/data-context/src/` before retrying `yarn`.
