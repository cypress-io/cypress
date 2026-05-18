---
name: building-cypress-binary
description: >-
  Builds and packages the Cypress Electron binary locally (yarn binary-build,
  binary-package, binary-zip, Docker/Linux parity), including non-interactive
  --version/--platform flags for scripts/binary.js. Covers macOS signing,
  optional env speedups, and why the tree is dirty after a build. Use when the
  user asks to build the Cypress binary, binary-package, electron app artifact,
  or local binary zip; or when troubleshooting post-binary git status or
  automation prompts. For artifact-only debugging and the commit/clean/reset
  loop, use debugging-cypress-artifacts.
---

# Building the Cypress binary

Canonical reference: [guides/building-release-artifacts.md](../../../guides/building-release-artifacts.md) (npm `.tgz` vs binary `.zip`, CI context).

Artifact debugging (packaged CLI, `CYPRESS_RUN_BINARY`, git debug loop): [debugging-cypress-artifacts](../debugging-cypress-artifacts/SKILL.md).

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

**`--version`:** usually matches the root `package.json` version (e.g. `0.0.0-development` on the main branch).

**macOS local example** (skip notarization; Apple Silicon ad-hoc run after pack):

```bash
export SKIP_NOTARIZATION=1
export RESET_ADHOC_SIGNATURE=1   # arm64 only; harmless to omit on Intel
export V8_SNAPSHOT_DISABLE_MINIFY=1   # optional: faster packaging
yarn binary-build --version 0.0.0-development --platform darwin
yarn binary-package --version 0.0.0-development --platform darwin
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

## Why the repo looks “dirty” afterward

A full binary build drives **`yarn lerna run build`** and **`build-prod`** across packages, writes many **`dist/`** artifacts, uses a **root `build/`** symlink into a temp dir (`scripts/binary/build.ts` → `TMP_BUILD_DIR`), and can leave output **interleaved with source** (**.js` beside `.ts`**, some **`.ts` mutations**). Expect **`git status` to be unusable** until reset.

**Full reset:** `git clean -xfd && yarn` — destroys untracked/ignored files; do not rely on stash here.

**Keeping WIP through a build:** use the commit → build → clean → **`git reset HEAD~1`** loop or a **git worktree** — see [debugging-cypress-artifacts](../debugging-cypress-artifacts/SKILL.md).
