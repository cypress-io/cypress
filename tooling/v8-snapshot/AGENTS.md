# @tooling/v8-snapshot

Orchestrates V8 snapshot creation for the Cypress Electron application. It bundles app dependencies via `@tooling/packherd`, runs the Snapshot Doctor to classify each module as healthy (fully initialized in snapshot), deferred (loaded lazily at runtime), or norewrite (code must not be transformed), then compiles the resulting script into a binary snapshot blob using `@tooling/electron-mksnapshot` and installs it into the app.

## Key Commands

```sh
yarn build              # tsc + copy src/blueprint/ to dist/blueprint/

# Run a specific unit test file
yarn test-unit -- <path-to-spec>

# Filter unit tests by name pattern
yarn test-unit -- --grep "<pattern>"

# Run a specific integration test file
yarn test-integration -- <path-to-spec>

yarn check-ts           # Type-check without emitting
yarn clean              # Remove dist/
```

## Architecture

`src/` is organized into subdirectories by responsibility:

- **`v8-snapshot.ts`** — Public entry point; re-exports the primary API surface.
- **`generator/`** — Snapshot script generation pipeline:
  - `snapshot-generator.ts` — Top-level orchestrator; exposes `makeAndInstallSnapshot` and related methods.
  - `create-snapshot-bundle.ts` / `create-snapshot-script.ts` — Invoke `@tooling/packherd` and wrap the bundle in the snapshot entry template.
  - `snapshot-generate-entry-via-dependencies.ts` / `snapshot-generate-entry-via-yarn.ts` — Two strategies for generating the module entry list.
  - `snapshot-verifier.ts` — Executes a snapshot script inside a Node.js VM to detect violations.
  - `blueprint.ts` — Assembles the final snapshot script from bundle + blueprint globals.
  - `snapshot-generator-flags.ts` / `write-config-json.ts` — CLI flags and config serialization.
- **`doctor/`** — Snapshot Doctor; iteratively finds the optimal healthy/deferred/norewrite classification:
  - `snapshot-doctor.ts` — Core doctor logic; `heal()` drives the multi-pass verification loop.
  - `determine-deferred.ts` — Computes which modules must be deferred based on verification results.
  - `process-script.async.ts` / `process-script.worker.ts` — Worker-based parallel script processing (one worker per CPU).
  - `circular-imports.ts` — Detects and handles circular dependency edges.
  - `warnings-processor.ts` — Maps VM error messages to doctor consequences (Defer / Norewrite / None).
- **`blueprint/`** — Plain `.js` files embedded verbatim into snapshot scripts:
  - `globals.js` / `globals-strict.js` — Patch global objects; strict variant catches `new Error`, `Promise`, etc. that would segfault `mksnapshot`.
  - `custom-require.js` — Custom `require` shim used inside the snapshot context.
  - `set-globals.js` — Applies patched globals at snapshot initialization time.
- **`setup/`** — Entry generation and snapshot installation helpers:
  - `v8-snapshot-entry.ts` / `v8-snapshot-entry-cy-in-cy.ts` — Entry point templates for normal and cy-in-cy builds.
  - `install-snapshot.ts` — Copies compiled snapshot blobs into the Electron app.
  - `consolidate-deps.ts` / `generate-entry.ts` / `generate-metadata.ts` — Dependency consolidation and metadata helpers.
  - `force-no-rewrite.ts` — Applies norewrite overrides.
  - `config.ts` / `index.ts` — Setup configuration and public re-exports.
- **`snapbuild/`** — Uses optional platform-specific `@cypress/snapbuild-*` binaries (or falls back to `@tooling/electron-mksnapshot`) to compile snapshot scripts to blobs.
- **`meta/`** — `dependency-map.ts` builds and queries the module dependency graph used by the doctor.
- **`sourcemap/`** — `process-sourcemap.ts` rewrites source maps after bundle transformation.
- **`types.ts`** / **`utils.ts`** / **`constants.ts`** — Shared types, utilities, and constants.

## Gotchas / Notes

- **`yarn build` must be used, not `tsc` alone.** The build script runs `rimraf ./dist/blueprint && cpr ./src/blueprint ./dist/blueprint` after compilation. Running `tsc` directly leaves `dist/blueprint/` absent or stale, causing runtime failures.
- **Strict vs. non-strict blueprint**: During doctor runs a strict globals shim (`globals-strict.js`) is used to catch violations (e.g. `new Error(...)`) that would silently cause a segfault in `mksnapshot`. The non-strict `globals.js` is used in the final production snapshot.
- **Snapshot Doctor is CPU-parallel**: The doctor spawns one worker per available CPU via `worker-nodes`. On machines with many cores this is fast but memory-intensive; on CI it may need `--max-old-space-size` tuning.
- **`snapshot-meta.json` cache**: The doctor writes a `snapshot-meta.json` to the cache directory. If `yarn.lock` has not changed (hash matches), a subsequent run reuses the previous classification without re-running the doctor. Delete `./cache/snapshot-meta.json` to force a fresh run, or set `V8_SNAPSHOT_FROM_SCRATCH=1`.
- **Env vars** that affect behavior:
  - `SNAPSHOT_BUNDLER` — Override the Go binary used to produce the JS bundle.
  - `SNAPSHOT_KEEP_CONFIG` — Retain the temporary JSON config passed to the bundler (useful for debugging).
  - `V8_SNAPSHOT_FROM_SCRATCH` — Skip the cache and regenerate the snapshot from scratch.

## Integration Points

- **`@tooling/packherd`** — Called by the generator to produce the initial esbuild bundle and dependency metadata.
- **`@tooling/electron-mksnapshot`** — Called by `snapbuild/` when no platform-specific `@cypress/snapbuild-*` binary is available, to download and run `mksnapshot` for the target Electron version.
- **`@packages/v8-snapshot-require`** — The runtime counterpart; loads the installed snapshot blob and handles module resolution at Cypress app startup. Changes to snapshot format or the `custom-require.js` blueprint may require coordinated changes there.
- **`@packages/data-context`** — Declared as an Nx implicit dependency; changes to `data-context` trigger a v8-snapshot rebuild in CI even without direct code changes.
