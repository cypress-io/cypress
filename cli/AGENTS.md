# CLI Workspace

## Purpose

The `cli/` workspace contains the `cypress` npm package — the user-facing CLI and programmatic API — plus the first-party component-testing mount adapters that ship bundled inside it. This is the top-level package users install (`npm install cypress`). The mount adapters (`@cypress/react`, `@cypress/vue`, etc.) live here as sibling directories and are published independently on npm, but their built artifacts are also copied into `cli/` so that users can import them as `cypress/react`, `cypress/vue`, etc.

## Package Map

### Main CLI

**cypress** — The `cypress` npm package. Provides the `cypress` binary, programmatic Node.js API, TypeScript type definitions, and re-exports the built CT adapter artifacts.

### Component-Testing Adapters

**@cypress/angular** — Mount adapter for Angular 21+ components.

**@cypress/mount-utils** — Internal shared utilities and types that all CT mount adapters depend on. Not intended for direct use by end users.

**@cypress/react** — Mount adapter for React 18+ components.

**@cypress/svelte** — Mount adapter for Svelte 5+ components.

**@cypress/vue** — Mount adapter for Vue 3 components.

## Workspace Commands

```bash
# Build the main cypress CLI package
cd cli && yarn build-cli

# Build only (no pre/post steps)
cd cli && yarn build

# Run a specific unit test file
cd cli && yarn test-unit -- <path-to-spec>

# Run unit tests matching a glob pattern
cd cli && yarn test-unit -- "<glob-pattern>"

# Type-check types/
cd cli && yarn types

# Build a CT adapter (example: react)
cd cli/react && yarn build

# Build mount-utils (tsc-based, not rollup)
cd cli/mount-utils && yarn build
```

## Unit Tests

The `unit-tests` CI job runs only on `linux-x64` and `windows` — there is no arm64 executor — so **a spec coupled to the host machine passes CI and still fails for contributors**, most often on Apple Silicon. Keep specs host-independent.

- **Pin the architecture at both layers.** `util.getRealArch()` consults `os.arch()` only for its early returns; otherwise it falls through to the `arch` package, which reports the real machine. A spec asserting on output that carries an arch — `Platform:` lines, download URLs, `?arch=` query params, CDN build URLs — needs a file-scoped `vi.mock('arch', () => ({ default: () => 'x64' }))` alongside `vi.mocked(os.arch).mockReturnValue('x64')`. Mock it per file rather than globally through `setupFiles`: some specs exercise real-machine detection deliberately, and a shared mock hides the dependency from the file that relies on it.
- **Keep test helpers generic.** Normalizers that scrub output before snapshotting must match the shape of a host value, not the value itself — `&arch=[\w-]+`, never `&arch=x64` — so the helper cannot re-couple a snapshot to the host.
- **Never run `vitest -u` to clear a host-dependent failure.** Committed snapshots encode the canonical values; regenerating them on a different machine buries the coupling and breaks everyone else. Fix the mock instead.
- **Treat other host facts the same way** — `os.platform()`, `os.release()`, `os.tmpdir()`, `os.homedir()`, cache directories, path separators. Assert against mocked values, never whatever the machine reports.

Verify an arch or platform mock is load-bearing rather than decorative: flip its factory to the other value, run that spec, and confirm the expected tests fail. A mock wired to nothing is worse than no mock, because it reads as coverage.

`util._cachedArch` is a module-level singleton. A file-scoped `vi.mock('arch')` is in place before the first call, so the cached value is already the mocked one; reset it (`util._cachedArch = undefined`) only in specs that vary the arch between tests.

## Notes

- The main CLI build uses Rollup (configured in `rollup.config.mjs`). Entry points are `lib/index.ts`, `lib/cli.ts`, `lib/cypress.ts`, `lib/exec/xvfb.ts`, `lib/exec/spawn.ts`, and `lib/bin/cypress.ts`. Output goes to `dist/` and is copied to `build/` via `sync-build-dist.ts`.
- Each CT adapter's `postbuild` runs `../../scripts/sync-exported-npm-with-cli.js`, which copies the adapter's published files into the matching subdirectory under `cli/` (e.g. `npm/react/dist` → `cli/react/dist`). This is what makes `import ... from 'cypress/react'` work.
- Unit tests for the CLI itself live in `cli/test/` and run under Vitest (`test/**/*.spec.ts`).
- TypeScript type definitions for the public Cypress API live in `cli/types/`. The `dtslint` tool is used to validate them.
- The `CYPRESS_INSTALL_BINARY` environment variable can be set to a path or URL to override the binary downloaded during `postinstall`.
- The `cypress` package sets `"private": true` in its monorepo `package.json` — publishing is handled by CI scripts that prepare a separate `package.json`.
