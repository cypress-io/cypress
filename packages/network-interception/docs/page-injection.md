# Page injection architecture

Target design for Cypress AUT bridge injection across MITM proxy and CDP transports.
Stack context: [#33919](https://github.com/cypress-io/cypress/issues/33919).

> **Status:** Design doc for stages 5+. Upstack PRs may ship interim `ForDocumentPreparation` scaffolding (middleware `ctx` passthrough). Implement toward this model — do not extend interim port shapes.

---

## Principles

1. **Core and policies never import proxy or CDP.** Later logic will not assume a proxy exists.
2. **Injection ≠ rewriting.** Injecting the Cypress bridge is separate from stripping framebusting / modifying obstructive code (`DocumentRewrite` policy).
3. **Three driven ports** (each with proxy and CDP adapter implementations):
   - **Request interception** — correlate, forward, continue (`ForRequestInterception`)
   - **Response interception** — pause, read, fulfill, continue (`ForResponseInterception`)
   - **Page injection** — get bridge scripts into AUT documents (`ForPageInjection`)
4. **Adapters self-register transport hooks.** The core does not pass middleware `this` or stream handles through port methods.
5. **Level selection and payload application differ by transport** (see below).

---

## Port: `ForPageInjection`

Configuration is **declarative** — manifests of script payloads, not per-response middleware calls.

```typescript
interface InjectionManifest {
  sameOrigin: {
    full: string    // runner injection.js bundle (+ optional document.domain wrapper)
    partial: string // document.domain shim only (or empty diagnostic script tag)
  }
  crossOrigin: {
    full: string    // runner injection_cross_origin.js bundle (+ config wrapper)
  }
}

interface ForPageInjection {
  configurePageInjection (manifest: InjectionManifest): void
}
```

Manifest assembly (bridge bundle paths, config flags) may live in core or the composition root; the port only receives the final strings.

### Proxy adapter (`ProxyPageInjection`)

- Registers response (and possibly request) middleware on the proxy at construction.
- **Per response:** gathers facts from wire/headers → `resolveInjectionLevel(facts)` → applies **one** manifest slice by rewriting the HTML body (stream splice / rewriter placement).
- Does **not** register a router script; level is decided in Node on each response.

### CDP adapter (`CdpPageInjection`)

- **Session setup:** composes a single router script from the manifest + shared level logic, then registers it via [`Page.addScriptToEvaluateOnNewDocument`](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-addScriptToEvaluateOnNewDocument).
- **Per navigation:** the injected router runs before page scripts, gathers facts in the browser, calls `resolveInjectionLevel`, and instantiates the matching manifest payload.
- Does **not** mutate Fetch response bodies for bridge injection (Fetch remains for interception / rewrite policies).

---

## Injection levels

Level semantics are **transport-agnostic** (`resolveInjectionLevel` in `lib/core/document-preparation.ts`). Adapters map observations into `InjectionLevelFacts`; core returns the level.

| Level | When | Payload | Purpose |
| --- | --- | --- | --- |
| `false` | Wrong type, frame, or origin context | — | Skip injection |
| `full` | First same-origin document load | `sameOrigin.full` (`injection.js`) | Install full AUT bridge (parent `Cypress`, XHR patch, timers, `app:window:before:load`) |
| `partial` | Later same-origin HTML navigations that render a document | `sameOrigin.partial` | Re-apply `document.domain` only; full bridge already ran on initial load |
| `fullCrossOrigin` | Cross-origin AUT iframe HTML | `crossOrigin.full` (`injection_cross_origin.js` + config) | Spec bridge, cookie simulation, fetch/XHR patches for cross-origin frames |

### Proxy-specific triggers (today)

| Level | Typical proxy signals |
| --- | --- |
| `full` | `__cypress.initial` cookie + HTML; buffered same-origin app reload |
| `partial` | Same-origin AUT HTML, not initial, origin already in `renderedHTMLOrigins`; file-server error pages |
| `fullCrossOrigin` | AUT frame + URL outside primary super-domain policy; buffered cross-origin reload |

### CDP-specific fact gathering

The same `InjectionLevelFacts` shape must be populated from **browser context** inside the composed router (cookies, `window.parent`, `location.origin`, frame relationship, etc.). Some proxy heuristics (e.g. Sec-Fetch-Dest → `isRenderedHTML`) need CDP-specific equivalents — that gatherer is adapter/browser-module concern, not core.

---

## Why CDP composes a router script

`addScriptToEvaluateOnNewDocument` is registered **once per target** and runs on **every** new document. Injection level is a **per-navigation** decision (initial vs subsequent, same-origin vs cross-origin AUT frame).

You cannot pick `full` vs `partial` vs `fullCrossOrigin` at `configurePageInjection` time. The CDP adapter therefore **composes** one script from:

1. **Per-level payloads** from `InjectionManifest`
2. **`resolveInjectionLevel`** (bundled — single source of truth with the proxy path)
3. **`gatherFactsInBrowser()`** (CDP-specific; produces `InjectionLevelFacts`)

```typescript
// Core-owned builder (no proxy/CDP imports)
composeInjectionRouter (manifest: InjectionManifest): string
```

The CDP adapter:

```typescript
configurePageInjection (manifest) {
  browserAutomation.addScriptToEvaluateOnNewDocument(
    composeInjectionRouter(manifest),
  )
}
```

Do not hand-write the router's `switch (level)` in the CDP adapter — use `composeInjectionRouter` so level rules cannot drift from `resolveInjectionLevel`.

---

## Rewriting is not page injection

| Concern | Owner | Proxy mechanism | CDP mechanism (TBD) |
| --- | --- | --- | --- |
| Strip framebusting / obstructive JS | `DocumentRewrite` policy | Response middleware → `rewriter.security` on stream | Fetch fulfill / header mutation |
| CSP allow-list | `CspAllowList` policy | Response header mutation | Header mutation on Fetch |
| Bridge / AUT scripts | `ForPageInjection` | HTML body splice | `addScriptToEvaluateOnNewDocument` router |

Policy order on the proxy response pipeline: **rewrite before inject** (eliminates today's `skipMiddleware('MaybeRemoveSecurity')` coupling in `inject-html.ts`).

Today's `rewriter.html` conflates rewrite + inject; target state splits `strip()` (policy effect) from HTML splice (injection adapter internal).

---

## Core responsibilities (summary)

| Artifact | Role |
| --- | --- |
| `InjectionLevelFacts`, `SecurityRemovalFacts` | Normalized inputs for pure decisions |
| `resolveInjectionLevel` | Level semantics (shared proxy Node + CDP browser bundle) |
| `resolveWantsSecurityRemoved` | `DocumentRewrite` policy decision |
| `InjectionManifest` | Payload contract for `ForPageInjection` |
| `composeInjectionRouter` | CDP router source from manifest + resolver (to be implemented) |
| `NetworkExchange` | Read-only facts for policy predicates (not live session handles) |

Core does **not** own stream mutation, middleware, or CDP session handles.

---

## Stage 5 scaffolding (current code)

| Today | Target |
| --- | --- |
| `ForDocumentPreparation` + `ProxyDocumentPreparationAdapter` | `ForPageInjection` + self-registering adapters |
| `setInjectionLevel` / `injectHtml` / `removeSecurity(ctx as ResponseInterceptionMiddlewareCtx)` | Facts in adapter → core decides → adapter applies manifest or policy effect |
| `removeSecurity` on document-prep port | `DocumentRewrite` policy on response interception |
| Core passthrough methods on `NetworkInterceptionCore` | Core orchestrates policies; adapters own hooks |

---

## Related docs

- [`../README.md`](../README.md) — stack stages and hexagonal mapping
- [`../../server/lib/adapters/README.md`](../../server/lib/adapters/README.md) — policy registration (driving port)
- Runner bundles: `packages/runner/injection/main.js`, `packages/runner/injection/cross-origin.js`
- Proxy adapter wiring (when present on branch): `packages/proxy/lib/adapters/README.md`
