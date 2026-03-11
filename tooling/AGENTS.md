# Tooling Workspace

## Purpose

The `tooling/` workspace contains internal build and development tooling for the Cypress monorepo. These packages are all marked `"private": true` and are not published as user-facing packages. They exist to support the Cypress Electron application's startup optimization pipeline — bundling dependencies, creating V8 snapshots, and managing the platform-specific `mksnapshot` binary.

## Package Map

**@tooling/electron-mksnapshot** — Downloads and runs the `mksnapshot` binary for a given Electron version on demand, rather than bundling a binary at install time.

**@tooling/packherd** — Bundles all dependencies reachable from an entry point using esbuild and produces the bundle plus metadata needed for snapshot generation.

**@tooling/v8-snapshot** — Orchestrates V8 snapshot creation for the Cypress Electron app: bundles modules via `@tooling/packherd`, runs the Snapshot Doctor to classify modules as healthy/deferred/norewrite, and installs the resulting snapshot blob.

## Workspace Commands

Each package follows the same pattern:

```sh
yarn workspace @tooling/<name> build         # Compile TypeScript to dist/

# Run a specific unit test file (mocha packages)
yarn workspace @tooling/<name> test-unit -- --grep "<pattern>"
yarn workspace @tooling/<name> test-unit -- <path-to-spec>

# Run a specific integration test file (mocha packages)
yarn workspace @tooling/<name> test-integration -- --grep "<pattern>"
yarn workspace @tooling/<name> test-integration -- <path-to-spec>

yarn workspace @tooling/<name> check-ts      # Type-check without emitting
yarn workspace @tooling/<name> clean         # Remove dist/
```

## Notes

- **Split runtime/build packages**: `@tooling/packherd` handles only bundling (step 1 of module loading). The runtime module loader (steps 2 and 3 — loading pre-bundled modules and on-demand TypeScript transpilation) lives in `@packages/packherd-require`.

- **Split runtime/build packages**: `@tooling/v8-snapshot` handles snapshot generation. The runtime side that loads and uses the snapshot at app startup lives in `@packages/v8-snapshot-require`.

- **v8-snapshot build step copies blueprint**: The `build` script for `@tooling/v8-snapshot` includes `cpr ./src/blueprint ./dist/blueprint` after `tsc` because the `src/blueprint/` directory contains plain `.js` files (not TypeScript) that the TypeScript compiler does not copy automatically.

- **Platform-specific snapshot binaries**: `@tooling/v8-snapshot` depends on optional `@cypress/snapbuild-*` packages for each target platform. These are used by `src/snapbuild/snapbuild.ts` and may not be present in all environments; the build falls back to downloading via `@tooling/electron-mksnapshot`.

- **Nx implicit dependency**: `@tooling/v8-snapshot` declares `@packages/data-context` as an implicit Nx dependency, meaning changes to `data-context` trigger v8-snapshot rebuilds in CI.
