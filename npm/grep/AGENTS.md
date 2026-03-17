# @cypress/grep

`@cypress/grep` is a published npm package providing test filtering capabilities for Cypress. It allows users to run subsets of tests by matching against test title substrings or user-defined tags, with options for spec-level pre-filtering and test burning (repeated test execution to detect flakiness).

## Key Commands

```sh
yarn build          # tsc; outputs to dist/
yarn lint           # ESLint
yarn test -- <path-to-spec>             # run a specific vitest spec file
yarn test -- "<glob-pattern>"          # run vitest specs matching a glob

# Integration test scripts (each exercises a different filtering scenario):
yarn grep           # filter by title substring
yarn tags           # filter by tag
yarn burn           # repeat tests N times
yarn filter:specs   # skip specs with no matching tests
yarn omit:specs     # omit filtered specs from results
# ...and many more scenario-specific scripts in package.json
```

## Architecture

- `src/index.ts` — main entry point; registers `it`/`describe` overrides and installs grep filtering logic in the Cypress browser context
- `src/plugin.ts` — Node-side plugin to be registered in `cypress.config.ts`; handles spec pre-filtering
- `src/register.ts` — support file registration helper
- `src/utils.ts` — shared utilities (tag parsing, string matching, etc.)

## Gotchas / Notes

- Two separate entry points are published (`"."` and `"./plugin"`): the root entry is loaded in the browser support file, and `@cypress/grep/plugin` is loaded in the Node plugin file (`setupNodeEvents`).
- Tag syntax supports boolean logic: space-separated tags are OR'd, `+`-joined tags are AND'd, and `-` prefix negates a tag (e.g., `smoke+-high` means "smoke AND NOT high").
- Marked with `"!cypress"` Nx implicit dependency to prevent circular build ordering.
- Uses `find-test-names` and `globby` for spec pre-filtering without running the browser.
