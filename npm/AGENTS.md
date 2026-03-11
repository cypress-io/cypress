# npm Workspace

## Purpose

The `npm/` directory contains the publicly published npm packages for the Cypress ecosystem, including component testing adapters for each supported UI framework, bundler integrations that power the component testing dev server, and plugins and dev tooling used by Cypress consumers and the Cypress team. These packages are versioned and released independently from the main `cypress` binary; they are released automatically via semantic-versioning commit prefixes (`feat`, `fix`, `chore`, etc.) when changes land on `develop`.

## Package Map

### Component Testing Adapters

- **@cypress/react** — Mount React components (React 18+) in the Cypress test runner
- **@cypress/vue** — Mount Vue 3 components in the Cypress test runner
- **@cypress/angular** — Mount Angular components (Angular 18+) in the Cypress test runner using zone.js
- **@cypress/angular-zoneless** — Mount Angular components (Angular 20+) without zone.js for zoneless change detection
- **@cypress/svelte** — Mount Svelte 5+ components in the Cypress test runner
- **@cypress/mount-utils** — Shared utility types and helper functions consumed by all component testing adapters; not intended for direct use by end users

### Bundler Integrations

- **@cypress/webpack-dev-server** — Implements the object-syntax `devServer` API for Cypress component testing backed by Webpack Dev Server
- **@cypress/vite-dev-server** — Implements the object-syntax `devServer` API for Cypress component testing backed by Vite (supports Vite 5, 6, and 7)
- **@cypress/webpack-preprocessor** — Cypress file preprocessor for bundling test files via Webpack 5; requires peer deps (`@babel/core`, `babel-loader`, etc.) to be installed by the consumer
- **@cypress/webpack-batteries-included-preprocessor** — Wrapper around `@cypress/webpack-preprocessor` that bundles Babel, TypeScript, and CoffeeScript loaders so consumers do not need to configure them separately
- **@cypress/vite-plugin-cypress-esm** — Vite plugin (alpha) that wraps ES modules in a `Proxy` to allow mutation/mocking of ESM namespaces in component tests

### Plugins & Dev Tooling

- **@cypress/grep** — Plugin for filtering Cypress tests by substring or tags at runtime, with options for spec pre-filtering and test burning
- **@cypress/puppeteer** — Plugin for accessing Puppeteer's browser API (`page`, `browser`) from within Cypress test commands via a `cy.puppeteer()` style interface
- **@cypress/schematic** — Official Angular CLI schematic and builder for scaffolding Cypress configuration into Angular projects (`ng add @cypress/schematic`)
- **@cypress/eslint-plugin-dev** — Internal ESLint plugin containing shared lint rules used across Cypress development packages; not intended for use by Cypress consumers

## Workspace Commands

Each package manages its own build. From within a package directory:

```sh
yarn build          # compile TypeScript / run rollup (varies by package)
yarn check-ts       # type-check without emitting
yarn lint           # run ESLint
yarn test -- <path-to-spec>          # run vitest targeting a specific file (unit test packages)
yarn test -- "<glob-pattern>"        # run vitest specs matching a glob (unit test packages)
yarn cy:run -- --spec <path-to-spec> # run a specific spec (adapter packages)
```

From the monorepo root using Nx:

```sh
yarn nx build @cypress/<pkg>      # build a single package
yarn nx run-many -t build --projects=tag:npm   # build all npm packages
```

## Notes

- Several packages (`react`, `vue`, `angular`, `angular-zoneless`, `svelte`, `mount-utils`) run a `postbuild` script (`sync-exported-npm-with-cli.js`) that copies their `dist/` output into the `cli/` directory so the main `cypress` binary bundles them. Changes to these packages must be built before testing in the main binary.
- `@cypress/webpack-dev-server` and `@cypress/vite-dev-server` are bundled with the Cypress binary and generally do not need to be installed separately by end users; the object-syntax `devServer` config in `cypress.config.ts` is the primary API.
- `@cypress/webpack-batteries-included-preprocessor` requires `@cypress/webpack-preprocessor` as a peer dependency and must be installed alongside it.
- `@cypress/eslint-plugin-dev` is for internal Cypress development only — do not recommend it to end users; the user-facing ESLint plugin lives at `eslint-plugin-cypress` (a separate repository).
- `@cypress/xpath` (also in this directory) is deprecated and no longer maintained.
- Releases are triggered automatically by semantic commit messages on `develop`; there is no manual publish step for individual packages.
