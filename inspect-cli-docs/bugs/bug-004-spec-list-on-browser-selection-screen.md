# BUG-004 — `SPEC_LIST` on browser selection screen

**Status:** 🔴 Open
**Severity:** Medium (misleading state; any CLI flow that gates on `appRoute` will act as if the runner is live before the browser has been launched)
**Affects:** Phase 0+
**Reported:** 2026-04-22

## Observed

With `yarn dev` running, after selecting a project and a testing type, the UI lands on the browser selection screen (list of detected browsers, "Start E2E Testing in Chrome" button not yet clicked):

```
$ cypress inspect status
Project:        /Users/.../cypress-example-kitchensink
Testing type:   e2e
Browser:        chrome (closed)
App route:      SPEC_LIST          # ← wrong, user is still picking a browser
```

## Expected

`appRoute` should be `BROWSER_SELECTION` until the user actually launches a browser. Only once `browserStatus` transitions to `'opening'` / `'open'` should the route advance to `SPEC_LIST`.

## Root cause

`deriveAppRoute` in `packages/data-context/graphql/schemaTypes/objectTypes/gql-InspectSnapshot.ts` gates `BROWSER_SELECTION` on `!coreData.activeBrowser`:

```ts
if (!coreData.activeBrowser) {
  return 'BROWSER_SELECTION'
}
```

But `activeBrowser` is pre-populated during project lifecycle initialization — `ProjectLifecycleManager.setInitialActiveBrowser` (`packages/data-context/src/data/ProjectLifecycleManager.ts:290-338`) picks the CLI-requested browser, the last-used browser, or `browsers[0]` and calls `BrowserActions.setActiveBrowser` before the UI renders the browser picker. So by the time the user is looking at the selection screen, `activeBrowser` is already non-null (it's the pre-highlighted default), and `deriveAppRoute` falls through to `SPEC_LIST`.

The accurate signal for "user has not launched a browser yet" is `coreData.app.browserStatus === 'closed'` (`BROWSER_STATUS = ['closed', 'opening', 'open']` — see `packages/types/src/browser.ts:68`).

## Fix (proposed)

Gate `BROWSER_SELECTION` on browser launch status rather than selection:

```ts
if (coreData.app.browserStatus === 'closed') {
  return 'BROWSER_SELECTION'
}
```

This keeps `activeBrowser` as the "which browser will launch" field and lets `browserStatus` drive the route transition. `inspectSnapshot` already exposes `browserStatus` (`gql-InspectSnapshot.ts:96-100`) so clients can read it directly if they want finer-grained state.

Edge case: `cypress run` auto-launches so `browserStatus` flows `closed → opening → open` without user interaction — `inspect status` against a `run`-mode instance during the brief `closed` window would report `BROWSER_SELECTION`, but that window is narrow and `inspect` is open-mode-targeted anyway.
