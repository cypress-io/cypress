# @packages/browser-automation

Browser-automation adapters for Cypress driven through CDP (and, later, WebDriver BiDi).

## What lives here

- **`CdpBridgeInjectionAdapter`** — installs the Cypress bridge (`window.Cypress`) into the
  AUT via `Page.addScriptToEvaluateOnNewDocument`, replacing proxy HTML rewriting on
  the bypass path. See issue #33849. It registers the bridge for a **primary origin**
  supplied by the caller and re-registers (detach + attach) when that origin changes,
  because the document-context bridge bakes the primary origin in as a constant (a
  cross-subdomain AUT frame can't read `window.top.location` under web security).
- **`AbstractBridgeInjection`** — transport-agnostic base that assembles the injectable
  source: it wraps the document-context bundle from `@packages/injection` and serializes the
  primary origin, document.domain config, cross-origin config, and runner sources into the
  `injectAutBridge(...)` call. Concrete adapters implement `inject()` per transport.

## Boundaries

- Depends on **`@packages/injection`** for the document-context bundle (the scaffolding that
  decides the per-frame injection level and dispatches), **`@packages/resolve-dist`** for
  the runner injection sources (the same source the proxy uses — no duplicated bridge
  strings), and **`@packages/network-tools`** for `DocumentDomainInjection` — both its config
  types and its origin reduction (`getOrigin`), which keys re-registration to the same
  (super)domain the in-document bridge resolves against.
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
