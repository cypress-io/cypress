# @cypress/vite-dev-server

`@cypress/vite-dev-server` is a published npm package that implements the object-syntax `devServer` API for Cypress component testing backed by Vite. It is bundled with the Cypress binary and typically does not need to be installed separately by end users.

## Key Commands

```sh
yarn build        # tsc (tsconfig.build.json); outputs to dist/
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
yarn test -- <path-to-spec>            # run a specific vitest spec file
yarn test -- "<glob-pattern>"          # run vitest specs matching a glob
```

## Architecture

- `src/devServer.ts` — main entry point; resolves framework config and starts the Vite dev server
- `src/getVite.ts` — dynamically loads the correct installed version of Vite (5, 6, or 7)
- `src/resolveConfig.ts` — merges user Vite config with Cypress-specific overrides
- `src/constants.ts` — shared constants
- `src/plugins/` — Vite plugins injected by the dev server:
  - `cypress.ts` — injects the Cypress client runtime
  - `sourcemap.ts` — source map handling
- `client/` — browser-side runtime code served to the AUT iframe
- `index.html` — template HTML for the component test runner

## Gotchas / Notes

- Published as an ES module (`"type": "module"` in package.json). Importing from CommonJS contexts requires special handling.
- Supports Vite 5, 6, and 7 simultaneously via aliased dev dependencies (`vite-5`, `vite-6`, `vite-7`) and dynamic version detection at runtime.
- The package runs its own integration tests using a "cypress-in-cypress" approach (`cypress:run`/`cypress:open` scripts) that set special environment variables (`CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT`).

## Integration Points

- Used as the dev server backend when users configure `devServer: { bundler: 'vite', ... }` in `cypress.config.ts`.
- Works alongside the component testing adapter packages (`@cypress/react`, `@cypress/vue`, etc.) which provide the `mount` function.
