# @packages/network-interception

Types and **port interfaces** for Cypress network interception (`cy.intercept`, config policies, proxy middleware). Part of the stacked refactor in [#33919](https://github.com/cypress-io/cypress/issues/33919) to support HTTP/2 (CDP Fetch / BiDi) without rewriting intercept logic.

> **Stack stage 3 of 8.** **Core** extracted: `NetworkInterceptionCore` owns pure route matching, subscription planning, and handler merge. Net-stubbing and proxy middleware delegate through the core. Policy registry still not invoked from middleware.

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
| **Driving port** (primary) | Outside actors **call into** interception | `ForInterceptRegistration`, `ForNetworkPolicyRegistration` |
| **Driven port** (secondary) | Interception **calls out** for I/O | `ForRequestInterception`, `ForCookieState`, … |
| **Core** | Domain orchestration without transport imports | **`NetworkInterceptionCore`** (`lib/core/`) — this stage |
| **Composition root** | Constructs and injects adapters + core | `createProxyRuntime()` |

The **core** is the hexagonal "inside": it may call **driven ports** (once wired in stages 4–6) but must not import proxy or net-stubbing directly.

---

## What stage 3 delivers

### `NetworkInterceptionCore` (`lib/core/network-interception-core.ts`)

Pure intercept orchestration moved out of net-stubbing middleware:

| Module | Responsibility |
| --- | --- |
| `route-matching.ts` | `matchRoutes`, `doesRouteMatch`, preflight matching |
| `plan-subscriptions.ts` | Which routes subscribe to which request events |
| `merge-handler-result.ts` | Merge driver handler results into `IncomingHttpRequest` |
| `matcher-fields.ts` | String matcher field metadata |

Net-stubbing keeps **I/O** in `handle-intercept-request.ts` (body streaming, `InterceptedRequest` lifecycle). Middleware calls the core for decisions, then legacy I/O for side effects.

### Wiring

```
createProxyRuntime()
  → new NetworkInterceptionCore()
  → passed to NetworkProxy as networkInterceptionCore on Http ctx

net-stubbing request middleware
  → ctx.networkInterceptionCore.matchRoutes / handleRequest / …
  → handleInterceptRequest() for streaming I/O
```

Driven ports on the core constructor exist but are **optional stubs** until stages 4–6 populate them via adapters.

### Prior stages (unchanged behavior)

- **Stage 1:** `ForInterceptRegistration` — [`packages/net-stubbing/lib/adapters/README.md`](../net-stubbing/lib/adapters/README.md)
- **Stage 2:** `ForNetworkPolicyRegistration` + registry — [`packages/server/lib/adapters/README.md`](../../server/lib/adapters/README.md)

---

## Stack roadmap

| Stage | Branch | Adds |
| --- | --- | --- |
| 0–2 | … | Package, driving ports, policy registry |
| **3** | **`refactor/ports-adapters-3`** | **`NetworkInterceptionCore`** |
| 4 | `refactor/ports-adapters-4` | Driven-port adapters (request/response) |
| 5–7 | … | Document prep, capture/cookies, enforcement |

[#33919](https://github.com/cypress-io/cypress/issues/33919)

---

## Development

```bash
yarn workspace @packages/network-interception test
yarn workspace @packages/net-stubbing test
yarn workspace @packages/proxy test
yarn workspace @packages/server test-unit --grep network-runtime
```
