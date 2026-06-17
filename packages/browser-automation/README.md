# @packages/browser-automation

Browser-automation adapters for Cypress driven through CDP (and, later, WebDriver BiDi).

This package is the home for browser-side network/automation adapters used by the
HTTP/2 program, where the Cypress MITM proxy is bypassed for AUT traffic and the
browser speaks to origins directly. Logic that previously lived inline in
`@packages/server`'s `cdp_automation` and is shared with these adapters is intended
to migrate here over time.

## What lives here

- **`CdpAutBridgeAdapter`** — installs the Cypress bridge (`window.Cypress`) into the
  AUT via `Page.addScriptToEvaluateOnNewDocument`, replacing proxy HTML rewriting on
  the bypass path. See issue #33849.
- **`aut-identifier`** — the AUT-frame name constant/predicate, shared between
  `cdp_automation` and the bridge adapter.

## Boundaries

- Depends on `@packages/resolve-dist` for the bridge contents (the same source the
  proxy uses — no duplicated bridge strings) and on `@packages/network-interception`
  for the driven-port contracts.
- Must **not** depend on `@packages/server` (that would be a cycle — `server` depends
  on this package).

## Commands

```bash
# Run unit tests
yarn workspace @packages/browser-automation test

# Type-check
yarn workspace @packages/browser-automation check-ts

# Build (CJS + ESM)
yarn workspace @packages/browser-automation build
```
