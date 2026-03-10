# Packages Workspace

## Purpose

The `packages/` workspace contains all first-party Cypress packages that make up the Cypress monorepo. These packages are the implementation of the Cypress test runner, its tooling, and supporting infrastructure. Each package is a standalone npm package (scoped under `@packages/`) consumed by the Cypress binary build, by each other, and in some cases by the public.

## Package Map

### App & Frontend

- **@packages/app** — The main Vue 3 front-end application for the Cypress browser-side UI (specs list, Test Replay, runner toolbar, Studio).
- **@packages/launchpad** — Vue 3 Electron-rendered application shown when running `cypress open`; handles login, project selection, and configuration setup.
- **@packages/frontend-shared** — Shared Vue 3 components, TailwindCSS config, composables, and i18n strings consumed by both `app` and `launchpad`.
- **@packages/reporter** — The test result reporter UI (command log, test tree) rendered inside the runner iframe.
- **@packages/runner** — Legacy webpack bundler for `driver` and `reporter`; being phased out in favour of `app`.

### Test Runner & Driver

- **@packages/driver** — Core JavaScript library loaded inside the browser; executes Cypress commands and manages the test runtime.
- **@packages/extension** — Chrome/Firefox WebExtension that enables browser automation (v2 Manifest V2, v3 Manifest V3).

### Server & Network

- **@packages/server** — Node.js heart of Cypress: HTTP server, proxy orchestration, file watching, plugin execution, and IPC with the browser.
- **@packages/proxy** — HTTP interception proxy layer; applies middleware to requests and responses to enable stubbing, rewriting, and header injection.
- **@packages/net-stubbing** — Server-side implementation of `cy.intercept()`; route matching, request/response lifecycle, and driver event bridge.
- **@packages/network** — Node.js networking utilities: HTTP/HTTPS proxy-aware agents, CA certificate management, and connection helpers.
- **@packages/network-tools** — Isomorphic (browser + Node.js) low-level networking utilities: CORS helpers, URI parsing, domain utilities.
- **@packages/https-proxy** — Intercepts TLS connections by acting as a dynamic CA; generates per-hostname certificates on the fly using `node-forge`.
- **@packages/rewriter** — Rewrites JS and HTML at proxy time to inject Cypress instrumentation (e.g., `document.domain` injection, spec bridge).

### Configuration & Data

- **@packages/config** — Canonical Cypress configuration schema, option definitions, validation logic, and AST-based `cypress.config` file transforms.
- **@packages/data-context** — Centralized GraphQL data layer (Nexus schema) for the Cypress app; manages project state, Cloud queries, file watching, and actions.
- **@packages/scaffold-config** — Detects frameworks/bundlers in a user's project and scaffolds `cypress.config.js` and supporting files during onboarding.

### Desktop & Electron

- **@packages/electron** — Installs, packages, and manages the Electron binary that wraps Cypress; provides the `cypress-electron` CLI entrypoint.
- **@packages/launcher** — Detects installed browsers on macOS, Linux, and Windows and launches them with the correct flags and profile paths.

### Types, Errors & Utilities

- **@packages/types** — Shared TypeScript type definitions used across the entire monorepo.
- **@packages/errors** — Centralised error definitions, formatting utilities, and `errTemplate` tagged-template system for all Cypress error messages.
- **@packages/socket** — Thin shared wrapper around `socket.io` client and server instances used for browser–server IPC.
- **@packages/telemetry** — OpenTelemetry convenience wrapper for capturing performance spans and usage signals inside Cypress processes.
- **@packages/icons** — Cypress icon assets (SVG, PNG, ICO) and build scripts that produce browser-consumable image files.
- **@packages/stderr-filtering** — Utility for tagging and filtering noisy third-party stderr output into `debug` streams.

### Build & Snapshot Infrastructure

- **@packages/v8-snapshot-require** — Loads V8 heap snapshots created by `@tooling/v8-snapshot` to accelerate Electron startup time.
- **@packages/packherd-require** — Module loader for bundles produced by `@tooling/packherd`; also provides on-demand TypeScript transpilation with source-map support.
- **@packages/web-config** — Shared webpack/Vite configuration helpers for browser bundles inside the monorepo.
- **@packages/ts** — Standardises `ts-node` version and base `tsconfig` options for development-time TypeScript require hooks.
- **@packages/eslint-config** — Monorepo-wide ESLint flat-config with rules for TypeScript, Vue, React, Cypress tests, and imports.
- **@packages/resolve-dist** — Centralizes path resolution for compiled/static assets referenced from server-side code.
- **@packages/root** — Bundles the monorepo root `package.json` as an installable package so any package can reference root metadata without absolute paths.
- **@packages/runner** — (see App & Frontend above)

## Workspace Commands

```bash
# Run tests targeting a specific file (vitest packages)
yarn workspace @packages/<name> test -- <path-to-spec>

# Run tests targeting a specific file glob (vitest packages)
yarn workspace @packages/<name> test -- "<glob-pattern>"

# Build a specific package
yarn workspace @packages/<name> build

# Run lint for a specific package
yarn workspace @packages/<name> lint

# Type-check a specific package
yarn workspace @packages/<name> check-ts

# Run all package builds (from repo root)
yarn build
```

## Notes

- Most packages publish both CJS (`cjs/`) and ESM (`esm/`) builds; the `main` field points to CJS and `module` to ESM.
- `@packages/ts` provides require-time TypeScript transpilation during development so most packages do not need pre-built `.js` files to run tests locally.
- Many packages use `vitest` for unit tests; the front-end packages (`app`, `launchpad`, `frontend-shared`) use Cypress component tests and E2E tests (cypress-in-cypress pattern).
- The `nohoist` workspace option is set in `driver` and `frontend-shared` to prevent specific dependencies from being hoisted to the monorepo root.
- Packages that depend on generated GraphQL types (from `data-context`) must run `yarn build:graphql` before type-checking will pass.
