# CLI Workspace

## Purpose

The `cli/` workspace contains the `cypress` npm package — the user-facing CLI and programmatic API — plus the first-party component-testing mount adapters that ship bundled inside it. This is the top-level package users install (`npm install cypress`). The mount adapters (`@cypress/react`, `@cypress/vue`, etc.) live here as sibling directories and are published independently on npm, but their built artifacts are also copied into `cli/` so that users can import them as `cypress/react`, `cypress/vue`, etc.

## Package Map

### Main CLI

**cypress** — The `cypress` npm package. Provides the `cypress` binary, programmatic Node.js API, TypeScript type definitions, and re-exports the built CT adapter artifacts.

### Component-Testing Adapters

**@cypress/angular** — Mount adapter for Angular 18+ components using zone.js-based change detection.

**@cypress/angular-zoneless** — Mount adapter for Angular 20+ components using the experimental zoneless change detection strategy (no zone.js).

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

## Notes

- The main CLI build uses Rollup (configured in `rollup.config.mjs`). Entry points are `lib/index.ts`, `lib/cli.ts`, `lib/cypress.ts`, `lib/exec/xvfb.ts`, `lib/exec/spawn.ts`, and `lib/bin/cypress.ts`. Output goes to `dist/` and is copied to `build/` via `sync-build-dist.ts`.
- Each CT adapter's `postbuild` runs `../../scripts/sync-exported-npm-with-cli.js`, which copies the adapter's published files into the matching subdirectory under `cli/` (e.g. `npm/react/dist` → `cli/react/dist`). This is what makes `import ... from 'cypress/react'` work.
- Unit tests for the CLI itself live in `cli/test/` and run under Vitest (`test/**/*.spec.ts`).
- TypeScript type definitions for the public Cypress API live in `cli/types/`. The `dtslint` tool is used to validate them.
- The `CYPRESS_INSTALL_BINARY` environment variable can be set to a path or URL to override the binary downloaded during `postinstall`.
- The `cypress` package sets `"private": true` in its monorepo `package.json` — publishing is handled by CI scripts that prepare a separate `package.json`.
