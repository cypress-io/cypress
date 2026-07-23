# PoC: detached headless open mode (tap-driven)

Investigation branch: `davidr/poc/tap-headless-open`. Goal: validate that agents
can run a fully hidden open-mode instance (no launchpad window, no browser
window, no dock icon) while every `cypress tap` command keeps working.

## Why this is expected to work

- `open --detached` already exists CLI-side (spawn detached + `Cypress is ready`
  sentinel + `unref`) — `cli/lib/exec/spawn.ts`.
- tap discovery needs only the HTTP probe on `serverPort` plus a non-null
  `cdpBrowserWsUrl`, which `browser-cri-client.ts` populates from
  `versionInfo.webSocketDebuggerUrl` identically headed or headless.
- Run mode already has complete per-browser headless plumbing keyed off
  `browser.isHeadless`; open mode just hard-forces `isHeadless: false` in
  `open_project.ts`.

## PoC gates (all default-off, behavior unchanged without them)

| Env var | Effect | Where |
|---|---|---|
| `POC_CHROME_HEADLESS_ARG=1` | Stage 0: this project's `before:browser:launch` pushes `--headless=new` (no Cypress source involved; extension still loads) | `cypress.config.js` here |
| `CYPRESS_INTERNAL_POC_HIDE_APP_WINDOW=1` | Stage 1: launchpad/app window created with `show: false`, macOS dock hidden | `packages/server/lib/modes/interactive.ts` |
| `CYPRESS_INTERNAL_POC_HEADLESS_BROWSER=1` | Stage 2: open mode sets `browser.isHeadless = true` → real run-mode headless branches (`--headless=new`, window-size args, extension skipped) | `packages/server/lib/open_project.ts` |

Also patched: `chrome.ts` `_setAutomation` passes `isTextTerminal || browser.isHeadless`
into `CdpAutomation.create`'s `isHeadless` slot so headless tab activation uses
`Page.bringToFront` instead of eating the 500ms extension timeout.

Stage 2 subsumes stage 0 — don't set both (harmless, just duplicate args).

## Running the stages

Rebuild both serving bundles first (stale ones silently run old code):

```sh
yarn workspace @packages/runner build
yarn workspace @packages/app build
```

Boot (background terminal; do NOT use `--detached` in dev mode — known spawn.ts
EPIPE bug kills dev-mode apps):

```sh
# Stage 0
POC_CHROME_HEADLESS_ARG=1 \
  node scripts/cypress.js open --project system-tests/projects/tap-headless-poc --browser chrome --e2e

# Stage 1 adds:
CYPRESS_INTERNAL_POC_HIDE_APP_WINDOW=1

# Stage 2 replaces POC_CHROME_HEADLESS_ARG with:
CYPRESS_INTERNAL_POC_HEADLESS_BROWSER=1
```

Validation checklist per stage (second terminal):

```sh
node cli/bin/cypress tap instances     # browser attached ⇒ cdpBrowserWsUrl populated
node cli/bin/cypress tap specs
node cli/bin/cypress tap run passing.cy.js --wait
node cli/bin/cypress tap status
node cli/bin/cypress tap tests         # then: tap commands <test-id>
node cli/bin/cypress tap run origin-swap.cy.js --wait   # cross-superdomain runner swap
node cli/bin/cypress tap dom h1
```

Also watch: no window/dock icon appears (stages 1+), `tap specs` latency after
the window is hidden (backgroundThrottling symptom), and spec-edit → rerun.

## Findings

(fill in per stage)

- Stage 0:
- Stage 1:
- Stage 2:

## Eventual real implementation (if validated)

Single `open --headless` flag composed with existing `--detached`:
CLI emits `--headed false` (already normalized by `cypress.ts`), consumed by
`interactive.ts` (hide window + dock) and `open_project.ts`
(`isHeadless = !headed`), plus gating `ElectronActions.showBrowserWindow` /
`AuthActions` focus calls, keeping the `chrome.ts` `_setAutomation` fix.

## Notes

- The two static servers (4621/4622) live in `setupNodeEvents`; opening this
  project twice concurrently will EADDRINUSE the second plugins process.
- tap requires CDP, so headless open is Chromium-family only by construction.
