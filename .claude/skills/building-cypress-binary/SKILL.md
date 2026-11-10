---
name: building-cypress-binary
description: >-
  Builds and packages the Cypress Electron binary locally (yarn binary-build,
  binary-package, binary-zip, Docker/Linux parity), including non-interactive
  --version/--platform flags and unsetting ELECTRON_RUN_AS_NODE for agent hosts.
  Covers macOS signing, optional env speedups, dist smoke-test pitfalls, and why
  the tree is dirty after a build. Use when the user asks to build the Cypress
  binary, binary-package, electron MODULE_NOT_FOUND during binary-build, or
  local binary zip. For artifact debugging, use debugging-cypress-artifacts.
---

# Building the Cypress binary

Canonical reference: [guides/building-release-artifacts.md](../../../guides/building-release-artifacts.md) (npm `.tgz` vs binary `.zip`, CI context).

Artifact debugging (packaged CLI, `CYPRESS_RUN_BINARY`, git debug loop): [debugging-cypress-artifacts](../debugging-cypress-artifacts/SKILL.md).

## Agent execution

Run from repo root with **Yarn 1** and Node per **`.node-version`**. Request **`network`** for `yarn` / `yarn lerna …`; request **`all`** for `yarn binary-build` and `yarn binary-package` (long runs, temp dir under OS tmp, high memory). Sandbox vs full permissions does **not** fix a failed dist smoke test if **`ELECTRON_RUN_AS_NODE=1`** is set — unset that var instead (below). Do not ask the user to approve each command separately during one build session.

**Prerequisites:** If `node_modules/.bin/lerna` or `rollup` is missing, run **`yarn`** first (postinstall runs the monorepo build; may take several minutes).

**Agent hosts:** Prefix binary commands with **`env -u ELECTRON_RUN_AS_NODE`** (or export `env -u ELECTRON_RUN_AS_NODE` for the shell session). Cursor/Electron environments often set this to `1`, which is unrelated to sandboxing.

## Commands (from repo root)

Use **Yarn 1** and the Node version in `.node-version`.

1. **`yarn binary-build`** — build the Electron app and staging tree (runs broad `lerna` `build` / `build-prod` as part of the pipeline).
2. **`yarn binary-package`** — package the built binary (electron-builder).
3. **`yarn binary-zip`** — zip the packaged output.

Linux parity with CI: run `yarn binary-build` and `yarn binary-package` **inside** `yarn docker` if you want the same environment as CI.

### Non-interactive (CI, agents, no TTY)

`scripts/binary/index.js` prompts for missing options via Inquirer. If **`version`** and **`platform`** are already present in argv (parsed with `minimist`), those prompts are skipped.

| Step | Required argv |
|------|----------------|
| `binary-build` | `--version <semver>` and `--platform <os>` |
| `binary-package` | same as build |
| `binary-zip` | `--platform <os>` only |

**`--platform`:** `darwin` \| `linux` \| `win32` (defaults to `os.platform()` when interactive).

**`--version`:** must match what the built app reports from **`node index.js --version`** in the staged `dist/` (via `@packages/root`). On `develop` this is often **not** root `package.json`’s `0.0.0-development` — e.g. a release-style **`15.x.x`** baked into packages. Before a long build, discover it with:

```bash
env -u ELECTRON_RUN_AS_NODE node packages/server/index.js --version
```

Or read stdout from a prior partial build’s `dist/`. A mismatch fails with `different version reported`.

**macOS local example** (skip notarization; Apple Silicon ad-hoc run after pack):

```bash
export SKIP_NOTARIZATION=1
export RESET_ADHOC_SIGNATURE=1   # arm64 only; harmless to omit on Intel
export V8_SNAPSHOT_DISABLE_MINIFY=1   # optional: faster packaging
BINARY_VERSION="$(env -u ELECTRON_RUN_AS_NODE node packages/server/index.js --version)"
env -u ELECTRON_RUN_AS_NODE yarn binary-build --version "$BINARY_VERSION" --platform darwin
env -u ELECTRON_RUN_AS_NODE yarn binary-package --version "$BINARY_VERSION" --platform darwin
yarn binary-zip --platform darwin
```

Yarn 1 forwards extra args to the script; an explicit `--` before flags also works if you prefer it.

## macOS

- Code signing: follow Apple’s code signing setup (see guide link above); [code-signing.md](../../../guides/code-signing.md) for CI-oriented detail.
- Local builds often skip notarization: set **`SKIP_NOTARIZATION=1`** (notarization needs an Apple Developer Program account).

## Optional environment

| Variable | Effect |
|----------|--------|
| `V8_SNAPSHOT_DISABLE_MINIFY=1` | Faster packaging (less minification work). |
| `RESET_ADHOC_SIGNATURE=1` | **Apple Silicon (M1+)** — often required to run the packaged binary locally after an ad-hoc sign. |
| `SKIP_NOTARIZATION=1` | Skip macOS notarization for local builds. |

**Unset for binary-build (do not export):** `ELECTRON_RUN_AS_NODE` — see next section.

## Why the repo looks “dirty” afterward

A full binary build drives **`yarn lerna run build`** and **`build-prod`** across packages, writes many **`dist/`** artifacts, uses a **root `build/`** symlink into a temp dir (`scripts/binary/build.ts` → `TMP_BUILD_DIR`), and can leave output **interleaved with source** (**.js` beside `.ts`**, some **`.ts` mutations**). Expect **`git status` to be unusable** until reset.

**Full reset:** `git clean -xfd && yarn` — destroys untracked/ignored files; do not rely on stash here.

**Keeping WIP through a build:** use the commit → build → clean → **`git reset HEAD~1`** loop or a **git worktree** — see [debugging-cypress-artifacts](../debugging-cypress-artifacts/SKILL.md).

## `binary-build` dist smoke test and `ELECTRON_RUN_AS_NODE`

After Lerna `build` / `build-prod`, `scripts/binary/build.ts` runs **`node index.js --version`** in the staged **`dist/`** tree (`TMP_BUILD_DIR`, e.g. `/tmp/cypress-build/darwin/dist`). `testDistVersion` compares stdout to the **`--version`** argv.

### `Cannot find module 'electron'` (false failure)

**Cause:** Parent shell has **`ELECTRON_RUN_AS_NODE=1`** (common in Cursor/Electron agent hosts). `packages/server/lib/util/electron-app.js` `isRunning()` then returns true, `start-cypress.js` calls **`require('electron')`**, and Node fails — the production **`dist/`** tree does **not** include the `electron` npm package (only the packaged Electron app later).

**Not:** missing `copyAllToDist` / sandbox hiding `node_modules`. Repro: with `ELECTRON_RUN_AS_NODE=1` the staged dist fails; with **`env -u ELECTRON_RUN_AS_NODE`** the same `node …/dist/index.js --version` succeeds.

**Mitigations:**

1. Agents: **`env -u ELECTRON_RUN_AS_NODE yarn binary-build …`** (and package steps).
2. Repo: `testDistVersion` in `scripts/binary/build.ts` omits **`ELECTRON_RUN_AS_NODE`** from the child `execa` env so builds are stable even when the parent sets it.

### `different version reported`

**Cause:** `--version` argv does not match **`node index.js --version`** from the built dist (version baked via `@packages/root` during the build, which may differ from root `package.json` on `develop`).

**Fix:** Use the discovery command in **Non-interactive** above, or stdout from a partial `dist/` after a failed build.
