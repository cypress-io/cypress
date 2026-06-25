# @packages/injection

The page-context Cypress injection **script and the business logic that decides what to
inject** — bundled into a single deliverable, automation-client agnostic, and with no
knowledge of *how* it actually gets into the page.

## Why this package exists

Historically Cypress injects its bridge (`window.Cypress`, the spec bridge, the
`document.domain` glue) by **rewriting AUT HTML at the MITM proxy**: every AUT HTML
response flows through `@packages/proxy`, which splices an injection `<script>` into the
document (see `packages/proxy/lib/http/util/inject.ts`). That only works when the proxy is enabled, 
which will not be the case with http/2 as the requests need to multiplex.

We now need to inject through an **automation client** — CDP today
([`Page.addScriptToEvaluateOnNewDocument`](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-addScriptToEvaluateOnNewDocument)),
WebDriver BiDi later ([`script.addPreloadScript`](https://www.w3.org/TR/webdriver-bidi/#command-script-addPreloadScript))
— instead of at the network layer. This package's single responsibility is to **own the injection script and the
business logic around injection, and bundle it**. It deliberately knows nothing about CDP,
BiDi, the server, or any transport: the *actual* injection happens elsewhere (today in
`@packages/browser-automation`). Keeping "what to inject / when" separate from "how to
deliver it" means the same logic serves any automation client.

## How this differs from proxy injection

|  | Proxy injection (today) | Http/2  (future)|
|---|---|---|
| Where the bridge enters the page | `@packages/proxy` rewrites the HTML response | a page-context script run by an automation client |
| What it requires | the MITM proxy on the AUT traffic path | an automation protocol driving the browser (CDP / BiDi) |
| Coupled to | HTTP responses | nothing — transport-agnostic |
| Injection-level decision | server-side, per response (`resolveInjectionLevel`) | in-page, per frame, from browser signals (`resolveAutInjectionLevel`) |

The injection *contents* (the runner / spec-bridge sources) are the same ones the proxy
uses. This package does **not** bundle them — they're read on the Node side and passed into
`injectAutBridge(...)` as arguments — and it reproduces the surrounding context the proxy
gave them (the `document.domain` host, the cross-origin `cypressConfig` wrapper) so the
runner boots identically.

## Where it fits in HTTP/2

The Cypress MITM proxy can't sit transparently in front of HTTP/2 AUT traffic, so the
HTTP/2 effort **bypasses the proxy for the AUT** — the browser speaks to origins directly.
With no proxy in the path there is no HTML response to rewrite, so the historical injection
mechanism is gone. Injection moves to the automation protocol instead, and this package is
the part of that flow that decides what to inject and packages it up:

1. The HTTP/2 path bypasses the Cypress proxy for AUT traffic.
2. With the proxy off the path, HTML-rewrite injection is unavailable.
3. A bridge adapter (`@packages/browser-automation`) registers this package's bundled
   script over its automation client (CDP `Page.addScriptToEvaluateOnNewDocument`) so it
   runs before any app script and survives `cy.reload()` / same-tab navigations.
4. The script self-guards on the AUT frame name, resolves the injection level in-page, and
   runs the appropriate runner source.

Spike issues: #33849 (full / same-origin), #33859 (cross-origin).

## Beyond HTTP/2 — replacing legacy injection

Nothing here actually requires HTTP/2. It only requires driving the browser over an
automation protocol, so the **same mechanism works with or without HTTP/2** — and it could
replace how Cypress injects today entirely, not just on the bypass path.

The current proxy-rewrite injection is very legacy and leans on a number of signals that
aren't 100% deterministic — whether the proxy is in the request path at all, HTML /
content-type sniffing of responses, request/response timing, and per-origin matching to
decide what to inject and when. An automation client's preload script
([CDP](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-addScriptToEvaluateOnNewDocument)
/ [BiDi](https://www.w3.org/TR/webdriver-bidi/#command-script-addPreloadScript)) instead runs
**before any page script, in every new document, in every frame**, regardless of how the
bytes reached the browser. That makes injecting this way both simpler and more reliable than
the response-rewriting path it can eventually replace.

The known exception is **WebKit**. Chromium (CDP) and Firefox (BiDi) both expose an
automation protocol with a preload-script primitive; WebKit — which Cypress drives via
Playwright — does not appear to offer an open automation protocol that supports this kind of
injection. Until an equivalent surfaces, WebKit would still need another mechanism (e.g. the
proxy-rewrite path).

## What lives here

- **`injectAutBridge(...)`** (`lib/index.ts`) — the page-context entry point. Runs in every
  frame: resolves the injection level and runs the matching runner source. This is the
  function the bundle exposes for an automation client to invoke.
- **`resolveAutInjectionLevel`** (`lib/resolve-aut-injection-level.ts`) — the pure decision
  (`none` | `full` | `cross-origin` | `partial`) from browser-readable signals; the in-page
  analogue of the proxy's `resolveInjectionLevel`.
- **`installAutBridgeInFrame`** (`lib/install-aut-bridge-in-frame.ts`) — gathers the
  per-frame signals (`window.name`, `frameElement.id`, origin vs. top) and dispatches to the
  resolved level.
- **`buildDocumentDomainInjection`** (`lib/build-document-domain-injection.ts`) — sets
  `document.domain` when the config calls for it (e2e + `injectDocumentDomain`).

## The deliverable

`rollup.config.mts` bundles the above into a single self-contained IIFE and ships it as a
**default-exported string** (`dist/index.js`, typed via `dist/index.d.ts`). That string is
the package's product: a consumer concatenates it with a call to `injectAutBridge(...)` and
hands the result to its automation client. The bundle is self-contained — its build-time
dependencies (`@packages/network-tools`, `@packages/types`) are inlined, so it has **no
runtime dependencies**.

## Boundaries

- **Automation-agnostic** — no CDP / BiDi / `@packages/server` imports. Transport lives in
  `@packages/browser-automation`.
- The runner injection **sources are not bundled here**; the consumer reads them (from
  `@packages/resolve-dist`) and passes them into `injectAutBridge(...)`, so already-bundled
  runner code is never re-bundled.

## Commands

```bash
# Run unit tests
yarn workspace @packages/injection test

# Build the page-context bundle (dist/index.js + dist/index.d.ts)
yarn workspace @packages/injection build

# Type-check
yarn workspace @packages/injection check-ts

# Lint
yarn workspace @packages/injection lint
```
