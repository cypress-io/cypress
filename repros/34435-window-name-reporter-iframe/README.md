# Reproduction: #34435 — Chrome selects the reporter iframe when the AUT overwrites `window.name`

Reproduces [cypress-io/cypress#34435](https://github.com/cypress-io/cypress/issues/34435).

## Summary

Cypress names the application-under-test (AUT) iframe with a value that begins
with `Your project:` so it can locate that frame again via the Chrome DevTools Protocol. When the
application under test overwrites `window.name`:

```js
window.name = 'application-window-123'
```

Cypress can no longer match the AUT frame by name. It then falls back to the
first child frame (`childFrames[0]`), which can be the **reporter** iframe
(whose URL is `about:blank`) rather than the AUT iframe.

The fallback lives in
[`packages/server/lib/browsers/cdp-protocol/cdp_automation.ts`](../../packages/server/lib/browsers/cdp-protocol/cdp_automation.ts):

```ts
if (!frame) {
  // if for whatever reason we cannot identify the AUT frame by name, we will
  // fall back to the first child frame that exists.
  if (frameTree?.childFrames?.[0]) {
    frame = frameTree.childFrames[0]
  } else {
    throw new Error('Could not find AUT frame')
  }
}
```

As a result `cy.url()` returns `about:blank` and the test fails.

Likely related to #34228.

## What's here

```
34435-window-name-reporter-iframe/
├── cypress.config.js            # baseUrl -> http://127.0.0.1:12345
├── cypress/e2e/window-name.cy.js  # visits "/", asserts cy.url()
├── serve.js                     # zero-dependency static server on 127.0.0.1:12345
├── site/index.html              # the AUT — overwrites window.name on load
└── package.json
```

## Running it

```bash
cd repros/34435-window-name-reporter-iframe
npm install
npm test
```

`npm test` starts the static site and runs Cypress against Chrome.

### Expected vs. actual

- **Cypress 15.18.1** — the test passes (`cy.url()` === `http://127.0.0.1:12345/`).
- **Cypress 15.19.0** — the test fails because `cy.url()` returns `about:blank`.

To compare versions, change the pinned `cypress` version in `package.json`
(or override on the fly):

```bash
# fails
npx cypress@15.19.0 run --browser chrome

# passes
npx cypress@15.18.1 run --browser chrome
```

> The bug is Chrome-specific and depends on the reporter iframe being present,
> so it reproduces with `cypress run`/`cypress open` against `--browser chrome`,
> not headless Electron.
