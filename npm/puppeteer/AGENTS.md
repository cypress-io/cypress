# @cypress/puppeteer

`@cypress/puppeteer` is a published npm package (public beta) that lets Cypress tests run Puppeteer code. Users register named message handlers in `setupNodeEvents` with `setup()`, then call them from specs with `cy.puppeteer(name, ...args)`. Each handler receives a Puppeteer `Browser` connected to the Cypress-launched browser. The main use case is multi-tab and multi-window work that Cypress can't do on its own.

## Key Commands

Run from `npm/puppeteer` after a root `yarn` install:

```sh
yarn build          # rimraf dist + tsc; outputs to dist/. Swallows tsc errors (`|| echo`), so use check-ts to catch them
yarn watch          # rimraf dist + tsc --watch
yarn check-ts       # tsc --noEmit
yarn lint           # ESLint (flat config, eslint.config.ts)
yarn test           # vitest run; specs live in test/unit/**/*.spec.ts
yarn test -- test/unit/setup.spec.ts   # run a single vitest spec
yarn test-watch     # vitest in watch mode
yarn test-debug     # vitest with --inspect-brk, no file parallelism
yarn cypress:open   # open the package's own e2e tests via ../../scripts/cypress.js
yarn cypress:run -- --spec cypress/e2e/multi-tab.cy.ts   # already passes --browser chrome; don't add another --browser
```

## Architecture

- `src/plugin/` — Node-side code, compiled to `dist/plugin/` (the package `main`):
  - `index.ts` — public entry; only re-exports `setup` and `retry`
  - `setup.ts` — validates options, listens to `after:browser:launch` to capture the browser and its `webSocketDebuggerUrl`, and registers the `__cypressPuppeteer__` task. Each task call runs `puppeteer.connect()`, invokes the handler, reactivates the main tab when needed, then `browser.disconnect()`s
  - `activateMainTab.ts` — runs in the first page via `page.evaluate`, posting `cypress:extension:activate:main:tab` and waiting up to 2s (`ACTIVATION_TIMEOUT`) for the Cypress extension to reply
  - `retry.ts` — user-facing `retry(fn, { timeout = 4000, delayBetweenTries = 200 })`
  - `util.ts` — `pluginError()` helper
- `src/support/index.ts` — browser-side; adds `cy.puppeteer()` as a wrapper around `cy.task('__cypressPuppeteer__', { name, args }, { log: false })` and rethrows `__error__` results
- `support/` — the published `@cypress/puppeteer/support` entry. `index.js` just requires `../dist/support`, so the package must be built for it to work; `index.d.ts` holds the hand-written `Chainable.puppeteer` types
- `test/unit/` — vitest specs for `setup`, `retry`, and `activateMainTab`
- `cypress/` + `cypress.config.ts` — the package's own e2e tests, which double as the README examples. The config imports `./src/plugin` directly, and `cypress/support/e2e.ts` imports `../../src/support`, so they don't need a build. It also starts an express static server on port 8000 as the `baseUrl`

## Gotchas / Notes

- Public beta — breaking changes may happen. Feedback goes to the GitHub discussion linked in the README.
- Only Chromium-family browsers work; the task returns an error for any other `family`. Electron is supported.
- In headed Chromium (not Electron), the plugin reactivates the main Cypress tab through the Cypress extension after every handler. Google Chrome 137+ can't load that extension, so `setup` throws in `after:browser:launch` for `browser.name === 'chrome'` at major version 137+ when headed (see #31703). Chrome for Testing and Chromium have different `name`s and aren't blocked.
- Errors cross the task boundary as `{ __error__: { name, message, stack } }` rather than as thrown errors, and `undefined` handler results become `null` because `cy.task()` rejects `undefined`. Keep both behaviors when changing `setup.ts` or `src/support/index.ts`.
- `after:browser:launch` needs Cypress 13.6.0+, which is why `peerDependencies.cypress` is `>=13.6.0`.
- When changing public behavior, update `README.md`, and keep its examples in sync with `cypress.config.ts` and `cypress/e2e/multi-tab.cy.ts`.
