# Cypress Monorepo — AGENTS.md

## Overview

Cypress is an open-source end-to-end and component testing framework for the modern web. This monorepo ships the Cypress desktop application and CLI (`cypress`), the JavaScript driver that runs tests in the browser, the Electron-based test runner, a suite of published npm packages (component testing adapters, webpack/vite dev-server integrations, plugins), and the internal tooling used to build and release all of it. Cypress is used by millions of developers to test web applications across Chrome, Firefox, Edge, WebKit, and Electron.

## Workspaces

- **`cli/`** — The main `cypress` npm package (CLI entry point) and co-located component testing framework adapters (`@cypress/react`, `@cypress/vue`, `@cypress/angular`, `@cypress/svelte`, `@cypress/mount-utils`)
- **`packages/`** — Core internal packages: the test driver, Electron app, HTTP server, proxy, rewriter, launcher, frontend Vue app, launchpad, reporter, config, data-context, telemetry, types, errors, and more (33 packages total)
- **`npm/`** — Publicly published npm packages: bundler integrations, component testing adapters, plugins, and dev tooling (15 packages)
- **`tooling/`** — Internal build tooling: V8 snapshot creation, `packherd` dependency bundler, and `electron-mksnapshot` (3 packages)
- **`system-tests/`** — Full end-to-end system test suite run against a built Cypress binary
- **`scripts/`** — Internal build, release, and CI automation scripts

## Prerequisites

- **Node**: Use the node version specified in the `.node-version` file (check with `node -v`; run `nvm use` to manage versions)
- **Package manager**: Yarn 1 (`yarn@1.22.22`) — do not use npm or pnpm
- **Lerna**: Orchestrated via root `package.json` scripts; installed as a dev dependency
- **Electron** (for binary builds): handled automatically by `@packages/electron` during build

## Common Commands

### Setup & Development

```bash
# Install all dependencies (runs post-install hooks automatically)
yarn

# Start Cypress in dev mode (watch, rebuilds on change)
yarn dev

# Open the Cypress GUI in dev + global mode
yarn start

```

### Testing

```bash
# Run tests scoped to a single package (preferred over bare yarn test)
yarn test --scope @packages/server

# Target a specific vitest spec file (packages that use vitest)
yarn workspace @packages/config test -- <path-to-spec>

# Target a specific vitest spec by glob pattern
yarn workspace @packages/net-stubbing test -- "<glob-pattern>"

# Target a specific mocha spec file (packages that use mocha)
yarn workspace @packages/server test-unit -- <path-to-spec>

# Filter mocha tests by name pattern
yarn workspace @packages/server test-unit -- --grep "<pattern>"

# Run system tests (full binary-level E2E)
yarn test-system

# Run Cypress headlessly against a specific spec (dev mode)
yarn cypress:run -- --spec "path/to/spec.cy.ts"

# Run Cypress component tests against a specific spec (dev mode)
yarn cypress:run:ct -- --spec "path/to/spec.cy.ts"
```

### Type Checking

```bash
# Type-check all TypeScript across the monorepo
yarn type-check

# Lerna-only type check pass
yarn check-ts
```

### Linting & Formatting

```bash
# Lint all packages (no bail, concurrency 2)
yarn lint

# Lint and auto-fix specific scopes
yarn lint:fix
```

> **Note**: This project does **not** use Prettier. All formatting is enforced via ESLint.

### Build

```bash
# Full monorepo build
yarn build

# Build V8 snapshot (dev)
yarn build-v8-snapshot-dev

# Build V8 snapshot (prod)
yarn build-v8-snapshot-prod

# Clean all build artifacts
yarn clean

# Clean and reinstall (nuclear)
yarn clean-deps && yarn
```

## Architecture

### CLI & Distribution

- **`cypress` (`cli/`)** — The `cypress` npm package users install. Entry point for `cypress open`, `cypress run`, `cypress install`, etc. Version: 15.x.

### Test Runner & Driver

- **`@packages/driver`** — The JavaScript test driver that executes user test code inside the browser. Implements Cypress commands, assertions, retries, and all `cy.*` APIs.
- **`@packages/runner`** — The webpack-bundled runner UI that hosts the AUT (application under test) iframe and driver communication layer.
- **`@packages/app`** — The Vue 3 frontend for the Cypress GUI / Launchpad. Main visual interface for the desktop app.
- **`@packages/launchpad`** — Project creation, onboarding, and test file scaffold UI.
- **`@packages/frontend-shared`** — Shared Vue components and design system tokens used by `app` and `launchpad`.
- **`@packages/reporter`** — The test results reporter UI component (pass/fail tree, log panel).

### Server & Network

- **`@packages/server`** — HTTP server responsible for serving test files, handling browser launching, socket communication, and orchestrating the test run.
- **`@packages/proxy`** — HTTP/S proxy that intercepts all browser traffic during a test run.
- **`@packages/net-stubbing`** — Network stubbing (`cy.intercept`) implementation — request matching, response manipulation.
- **`@packages/network`** — Low-level network protocol utilities.
- **`@packages/network-tools`** — Higher-level networking helpers used across packages.
- **`@packages/https-proxy`** — HTTPS proxy implementation for TLS interception.
- **`@packages/rewriter`** — JavaScript source rewriter that transforms test and app code for Cypress compatibility (instrument, polyfill, inject).

### Configuration & Data

- **`@packages/config`** — Configuration types, defaults, validation, and the public `defineConfig` API.
- **`@packages/data-context`** — Centralized GraphQL data access layer for the Cypress app (projects, specs, runs, settings).
- **`@packages/scaffold-config`** — Logic for scaffolding new testing setups via Launchpad (framework detection, config file generation).

### Desktop & Electron

- **`@packages/electron`** — Electron runtime wrapper, binary building utilities, and auto-update integration.
- **`@packages/launcher`** — Browser detection and launch logic for Chrome, Firefox, Edge, WebKit, and Electron.
- **`@packages/extension`** — WebExtension injected into browsers to enable cross-origin features and automation hooks.

### Types, Errors & Utilities

- **`@packages/types`** — Shared TypeScript type definitions used across all packages.
- **`@packages/errors`** — Cypress error definitions, error templates, and error utilities.
- **`@packages/socket`** — WebSocket communication library used for driver ↔ server messaging (browser and Node sides).
- **`@packages/telemetry`** — OpenTelemetry instrumentation wrapper used throughout the monorepo.
- **`@packages/icons`** — Icon registry and SVG assets.
- **`@packages/stderr-filtering`** — Stderr output filtering utilities.

### Build & Snapshot Infrastructure

- **`@packages/v8-snapshot-require`** — Module loading utilities for V8 snapshots in Electron.
- **`@packages/packherd-require`** — Module loader for dependencies bundled by `@tooling/packherd`.
- **`@packages/web-config`** — Webpack/PostCSS configuration for the Vue frontend bundles.
- **`@packages/ts`** — Shared TypeScript configuration and `ts-node` register helper.
- **`@packages/eslint-config`** — Shared ESLint configuration preset used across packages.
- **`@packages/resolve-dist`** — Resolves paths to compiled distribution artifacts.
- **`@tooling/v8-snapshot`** — V8 snapshot creation tooling for Electron startup optimization.
- **`@tooling/packherd`** — Bundles all reachable dependencies from an entry point into a single artifact.
- **`@tooling/electron-mksnapshot`** — Configurable `mksnapshot` binary wrapper for the target Electron version.

### Component Testing Adapters (published via `npm/`)

- **`@cypress/react`** — Component testing adapter for React.
- **`@cypress/vue`** — Component testing adapter for Vue.js.
- **`@cypress/angular`** — Component testing adapter for Angular.
- **`@cypress/angular-zoneless`** — Angular adapter without zone.js.
- **`@cypress/svelte`** — Component testing adapter for Svelte.
- **`@cypress/mount-utils`** — Shared utilities used by all component testing adapters.

### Bundler Integrations (published via `npm/`)

- **`@cypress/webpack-dev-server`** — Webpack Dev Server launcher for component testing.
- **`@cypress/vite-dev-server`** — Vite Dev Server launcher for component testing.
- **`@cypress/webpack-preprocessor`** — Webpack preprocessor for bundling test spec files.
- **`@cypress/webpack-batteries-included-preprocessor`** — Webpack preprocessor with batteries included (TypeScript, CoffeeScript, etc.).
- **`@cypress/vite-plugin-cypress-esm`** — Vite plugin for mutable ESM modules in browser tests.

### Plugins & Dev Tooling (published via `npm/`)

- **`@cypress/grep`** — Plugin to filter test runs by substring/tag.
- **`@cypress/puppeteer`** — Plugin to enhance Cypress tests with Puppeteer.
- **`@cypress/schematic`** — Official Angular CLI schematic for adding Cypress.
- **`@cypress/eslint-plugin-dev`** — ESLint rules shared across Cypress development packages.

## Code Conventions

- **No Prettier** — Formatting is enforced entirely through ESLint. The `.prettierignore` excludes all files.
- **Single quotes** — `'single'` quote style required for all JS/TS.
- **No semicolons** — Enforced via ESLint (`semi: 'never'`).
- **2-space indentation** — Standard across all JS/TS files.
- **Trailing commas** — Required in multiline contexts (`comma-dangle: 'always-multiline'`).
- **No `var`** — `var` declarations are an ESLint error; use `const` or `let`.
- **Template literals** — `prefer-template: 'error'` — no string concatenation.
- **Object shorthand** — `object-shorthand: 'error'`.
- **No `console`** — `no-console: 'error'`; use the logger utilities instead.
- **TypeScript**: `strict: true` base, but `noImplicitAny: false` (implicit `any` allowed for pragmatic reasons).
- **Type-only imports**: `importsNotUsedAsValues: "error"` — use `import type` for type-only imports.
- **Unused vars**: Prefix with `_` to suppress (`argsIgnorePattern: '^_'`).
- **No `.only` in tests** — `mocha/no-exclusive-tests: 'error'` (ESLint). Caught by `yarn lint` and by pre-commit ESLint (`lint-staged`). For intentional `.only` in fixtures or type samples, use `eslint-disable-next-line mocha/no-exclusive-tests` (with a short comment).
- **`.skip` requires a comment** — Must include `NOTE:`, `TODO:`, or `FIXME:` comment explaining why.
- **Blank line before `return`** — Enforced via `padding-line-between-statements`.
- **Sync FS calls** — Flagged with a warning (except `existsSync`); prefer async variants.

## Pull Requests

[`CONTRIBUTING.md`](./CONTRIBUTING.md) is the source of truth for PR conventions, including the semantic-release title prefix that determines the next version. The other essentials:

### Changelog & Template

- For user-facing changes shipping with the next Cypress version, add a changelog entry to [`cli/CHANGELOG.md`](./cli/CHANGELOG.md) — see the [Writing the Cypress Changelog Guide](./guides/writing-the-cypress-changelog.md).
- Fill out the [Pull Request Template](./.github/PULL_REQUEST_TEMPLATE.md) completely. Use `N/A` for irrelevant sections rather than deleting them — PRs will not be reviewed if the template is not filled in.

## CI/CD

- **Primary CI**: CircleCI. Config lives in `.circleci/src/` (modular) and is compiled to `.circleci/packed/pipeline.yml`. See [`.circleci/AGENTS.md`](.circleci/AGENTS.md) for when to add a branch to the full-CI allowlist (binary tests, Windows jobs, v8 snapshot validation).
- **Supplementary**: GitHub Actions for security scanning (Snyk), SBOM generation, browser version auto-updates, and PR validation.
- **Base branch**: `develop` — all PRs target `develop`; release branches follow `release/X.Y.Z`.
- **Multi-platform matrix**: Linux x64, Linux ARM64, macOS x64, macOS ARM64, Windows — all run in parallel.
- **Release gate**: All tests must pass through the `ready-to-release` aggregation job before `npm-release` runs.
- **External PRs**: Require manual approval via `approve-contributor-pr` gate before CI runs.
- **Binary builds**: Triggered separately after npm release; cross-platform binaries are assembled and distributed via CDN.

## Cursor Cloud specific instructions

### Environment

- Node.js >= 22.19.0 and Yarn 1.22.22 are pre-installed. The update script runs `yarn` which triggers the full postinstall (patch-package, yarn-deduplicate, rebuild better-sqlite3, lerna build, V8 snapshot).
- Xvfb is already running on `DISPLAY=:1`. Chrome is available at `/usr/bin/google-chrome-stable`.

### Running Cypress in dev mode

- `yarn dev` starts the Cypress Electron GUI in global/dev mode (Launchpad). It builds Vite bundles for `@packages/app` and `@packages/launchpad`, then launches Electron. The GraphQL server runs at `http://localhost:4444/__launchpad/graphql`.
- `yarn cypress:run -- --project <path> --browser chrome --headless` runs Cypress headlessly in dev mode. The config file at the target project must NOT `require('cypress')` since it resolves from the project root.

### Running tests

- Prefer scoped tests: `yarn workspace @packages/<name> test` (vitest) or `yarn test --scope @packages/<name>` (lerna).
- Some test suites (e.g., `@packages/network`) require privileged ports (443) and will fail with EACCES in unprivileged containers — this is expected.
- `@packages/config` has 2 tests that assert `cypressBinaryRoot` contains `'cypress'`; these fail when the workspace directory name differs (e.g., `/workspace`). This is a known path-dependent issue, not a code bug.

### Linting

- `yarn lint --scope @packages/<name>` for focused lint. Full monorepo lint: `yarn lint`.

### Key caveats

- The postinstall takes ~4-5 minutes (build + V8 snapshot generation). If `yarn` is interrupted, re-run it.
- `yarn --frozen-lockfile` should be preferred when the lockfile hasn't changed; it falls back to `yarn` (which runs postinstall) if it fails.
- Do not run `yarn` from within sub-packages. Always run from the repo root.
