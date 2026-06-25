# @packages/browser-automation

Browser-automation adapters for Cypress driven through CDP (and, later, WebDriver BiDi).

This package is the home for browser-side network/automation adapters used by the
HTTP/2 program, where the Cypress MITM proxy is bypassed for AUT traffic and the
browser speaks to origins directly. Logic that previously lived inline in
`@packages/server`'s `cdp_automation` and is shared with these adapters is intended
to migrate here over time.

## What lives here

- **`CdpBridgeInjectionAdapter`** — installs the Cypress bridge (`window.Cypress`) into the
  AUT via `Page.addScriptToEvaluateOnNewDocument`, replacing proxy HTML rewriting on
  the bypass path. See issue #33849.
- **`AbstractBridgeInjection`** — transport-agnostic base that assembles the injectable
  source: it wraps the page-context bundle from `@packages/injection` and serializes the
  document.domain config, cross-origin config, and runner sources into the
  `injectAutBridge(...)` call. Concrete adapters implement `inject()` per transport.

## Boundaries

- Depends on **`@packages/injection`** for the page-context bundle (the scaffolding that
  decides the per-frame injection level and dispatches), **`@packages/resolve-dist`** for
  the runner injection sources (the same source the proxy uses — no duplicated bridge
  strings), and **`@packages/network-tools`** for the `DocumentDomainInjection` config types.
- The driven-port contract (`ForAutBridgeInjection`) is declared locally under `lib/ports`.
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
