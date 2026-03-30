# @cypress/puppeteer

`@cypress/puppeteer` is a published npm package (currently in public beta) that provides a Cypress plugin enabling access to Puppeteer's browser API from within Cypress test commands, allowing teams to use Puppeteer capabilities (e.g., PDF generation, advanced browser control) alongside their Cypress tests.

## Key Commands

```sh
yarn build          # rimraf dist + tsc; outputs to dist/
yarn watch          # rimraf dist + tsc in watch mode
yarn check-ts       # TypeScript type-check without emitting
yarn lint           # ESLint
yarn test -- src/plugin/setup.spec.ts  # run a specific vitest spec file
yarn test -- "src/**/*.spec.ts"        # run vitest specs matching a glob
yarn cypress:run -- --spec "cypress/e2e/puppeteer.cy.ts" --browser chrome   # run a targeted integration test (Chrome required)
```

## Architecture

- `src/plugin/` — Node-side plugin code registered in `setupNodeEvents`:
  - `index.ts` — main plugin entry; sets up the Puppeteer CDP connection
  - `activateMainTab.ts` — focuses the main browser tab
  - `retry.ts` — retry utility for Puppeteer operations
  - `setup.ts` — initializes the Puppeteer connection to the Cypress-managed browser
  - `util.ts` — shared utilities
- `src/support/index.ts` — browser-side support commands (adds `cy.puppeteer()` or similar custom commands)
- `support/` — published support file directory (separate from `src/support` compiled output)

## Gotchas / Notes

- This package is in public beta — breaking changes may occur. Feedback is tracked in the GitHub discussion linked in the README.
- Requires Chrome (or a Chromium-based browser) because it relies on the Chrome DevTools Protocol (CDP) to connect Puppeteer to the Cypress-managed browser instance.
- The `cypress:run` script explicitly passes `--browser chrome`.
