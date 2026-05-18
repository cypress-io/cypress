---
name: debugging-cypress-artifacts
description: >-
  Debugs Cypress bugs that only reproduce in packaged artifacts (cli/build CLI
  plus binary-package output), not yarn dev. Covers the git commit/build/clean/
  reset debug loop, CYPRESS_RUN_BINARY, DEBUG and inspect flags, and workspace
  recovery without stash. Use when investigating artifact-only bugs, debugging
  after binary-build, or running a packaged cypress open/run repro loop.
---

# Debugging Cypress packaged artifacts

Some bugs only appear in **release-shaped** code: Rollup output under **`cli/build/`** (not `yarn dev`), plus the **packaged Electron app** from `binary-package` (not `scripts/start.js` / **`cypress open --dev`**).

Build steps: see [building-cypress-binary](../building-cypress-binary/SKILL.md).

## Git workflow for a debug loop (single checkout)

Binary builds use the **full tree** and leave the workspace unusable for normal dev (generated `.js` beside `.ts`, possible **`.ts` mutations**, `dist/`, root `build/` symlink, etc.). **Do not use `git stash push -a`** — stash mixes real WIP with binary cruft.

Use a **WIP commit** as a bookmark, then **reset** (not **`git revert`**) to restore edits after cleanup:

1. **`git checkout -b debug/<topic>`** (or stay on an existing debug branch).
2. **Analysis edits** (logging, temporary probes, etc.). Commit only what you mean — prefer **`git add <paths>`** over blind **`git commit -a`**, so build noise on tracked files is not swept into the WIP commit.
3. **`git commit -m "wip: debug …"`** if there are changes worth preserving.
4. **Build** packaged CLI and binary (see building skill): e.g. `yarn workspace cypress build-cli`, then `yarn binary-build` / `yarn binary-package` with non-interactive flags as needed.
5. **Repro** with packaged entrypoints (below).
6. **Restore workspace:**
   ```bash
   git clean -xfd && yarn
   git reset HEAD~1    # mixed (default): WIP commit → unstaged changes, same as before step 3
   ```
   Use **`git reset --soft HEAD~1`** if you want changes to stay staged. **Do not `git revert`** for this — revert adds a new undo commit; it does not put your WIP back in the working tree.

7. Repeat from step 2.

**Rules:** Do not **`git reset HEAD~1`** after pushing that WIP commit unless you intend to rewrite remote history. Untracked files not in the WIP commit are **gone** after `git clean -xfd`.

**Alternative:** a **separate git worktree** for binary-only work avoids the commit/reset dance; see the building skill’s reset section.

## Packaged CLI entrypoint

After **`yarn workspace cypress build-cli`** (or **`yarn lerna run build-cli`**):

```bash
<repo>/cli/build/bin/cypress <command>
```

It loads **`cli/build/dist/cli`**. Prefer an absolute path to the bin when cwd might confuse postinstall-relative logic.

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

- **CLI (Node):** `node --inspect-brk <repo>/cli/build/bin/cypress <command>`
- **Electron main (packaged):** `<repo>/cli/build/bin/cypress open --inspect-brk` (or `--inspect`); forwarded in `cli/lib/exec/open.ts` / `run.ts`. Use with **`CYPRESS_RUN_BINARY`** so the debuggee is your local package output.

## What to skip

- **`--dev`** on `open` / `run`
- Assuming **`yarn dev`** matches packaged behavior (`cli/lib/tasks/verify.ts` uses `scripts/start.js` when `dev` is true)

## Common workspace gotcha after `yarn`

If **`yarn`** / Vite fails on **`urqlSchema`** or **`urqlCacheKeys`** imports from `@packages/data-context`, stale **`packages/data-context/src/**/*.js`** files may be shadowing **`.ts`**. Regenerate (`yarn workspace @packages/data-context build`) and remove **`.js` siblings that have a matching `.ts`** under `packages/data-context/src/` before retrying `yarn`.
