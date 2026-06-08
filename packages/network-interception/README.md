# @packages/network-interception

Types and **port interfaces** for Cypress network interception (`cy.intercept`, config policies, proxy middleware). Part of the stacked refactor in [#33919](https://github.com/cypress-io/cypress/issues/33919) to support HTTP/2 (CDP Fetch / BiDi) without rewriting intercept logic.

> **Stack stage 4.** **`ForNetworkInterception.handle(request, next)`** is the driving port for per-request intercept. Proxy and future CDP adapters call it; core owns route matching, subscription orchestration, and handler merge. Cookies, injection, compression, and policy enforcement remain proxy driven ports.

---

## Why this refactor uses ports and adapters

Intercept code today lives inside `@packages/proxy` and `@packages/net-stubbing` middleware with a hard dependency on the MITM proxy transport. The HTTP/2 program needs the **same** matching, handler, and policy behavior while swapping **how** requests leave the browser (proxy vs CDP Fetch).

The codebase adopts **hexagonal architecture** (also called **ports and adapters**): keep interception rules in a transport-agnostic center, isolate I/O behind interfaces, plug in different implementations per transport.

---

## Hexagonal terms → this repo

| Hex term | Role | In this monorepo |
| --- | --- | --- |
| **Port** | Contract at the edge of the interception "inside" | `For*` types in `lib/ports/` |
| **Adapter** | Implements a port by delegating to existing Cypress code | `*Adapter` classes under `packages/*/lib/adapters/` |
| **Driving port** (primary) | Outside actors **call into** interception | `ForNetworkInterception`, `ForInterceptRegistration`, `ForNetworkPolicyRegistration` |
| **Driven port** (secondary) | Interception **calls out** for I/O | `ForInterceptionEvents`, `ForCookieState`, … |
| **Core** | Domain orchestration without transport imports | **`HttpInterception`**, **`NetworkInterceptionCore`** |
| **Composition root** | Constructs and injects adapters + core | `createProxyRuntime()` |

The **core** is the hexagonal "inside": it may call **driven ports** but must not import proxy or net-stubbing directly.

---

## `ForNetworkInterception.handle(request, next)`

Transport-neutral onion middleware for `cy.intercept`:

```typescript
type Interceptor = (
  request: HttpRequest,
  next: OriginForwarder,
) => Promise<HttpResponse>
```

| Semantics | Behavior |
| --- | --- |
| No matching routes | `return next(request)` |
| CORS preflight match | Fulfill 204 without calling `next` |
| Static stub / request-stage `req.reply` | Return synthetic response, never call `next` |
| Pass-through / header mutate | `const res = await next(modified); return applyResponseIntercept(res)` |
| `next` | Callable **at most once** — origin boundary (proxy Node HTTP fetch or future CDP continue) |

`inFlightInterceptId` is **adapter-owned** (proxy generates uuid). Core correlates driver subscriptions via that id while an intercept is in flight.

`ForInterceptionEvents` keeps `@packages/socket` out of core: `emitAndAwait`, `emit`, `resolveEventHandler`.

---

## Wiring

```
createProxyRuntime()
  → HttpInterception (ForNetworkInterception)
  → DriverInterceptionEventsAdapter (ForInterceptionEvents)
  → NetworkInterceptionCore (policies, cookies, injection, capture)
  → NetworkProxy.networkInterception

ApplyHttpInterception middleware
  → networkInterception.handle(toHttpRequest(ctx), forwardToOrigin)
  → applyHttpResponseToCtx
```

Non-intercept proxy stacks (cookies, document prep, compression, `blockHosts`) stay on existing middleware via driven ports on `NetworkInterceptionCore`.

---

## Development

```bash
yarn workspace @packages/network-interception test
yarn workspace @packages/net-stubbing test
yarn workspace @packages/proxy test
yarn workspace @packages/server test-unit --grep network-runtime
```

[#33919](https://github.com/cypress-io/cypress/issues/33919)
