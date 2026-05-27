# @packages/network-interception

Types and **port interfaces** for Cypress network interception (`cy.intercept`, config policies, proxy middleware). Part of the stacked refactor in [#33919](https://github.com/cypress-io/cypress/issues/33919) to support HTTP/2 (CDP Fetch / BiDi) without rewriting intercept logic.

> **Stack stage 0 of 8.** Package scaffold: shared types, port interface stubs, `createProxyRuntime()` composition root. **No behavior change.**

---

## Why this refactor uses ports and adapters

Intercept code today lives inside `@packages/proxy` and `@packages/net-stubbing` middleware with a hard dependency on the MITM proxy transport. The HTTP/2 program needs the **same** matching, handler, and policy behavior while swapping **how** requests leave the browser (proxy vs CDP Fetch).

The codebase adopts **hexagonal architecture** (also called **ports and adapters**): keep interception rules in a transport-agnostic center, isolate I/O behind interfaces, plug in different implementations per transport.

---

## Hexagonal terms → this repo

In hexagonal architecture, a **port** is a boundary interface; an **adapter** is the code on the other side of that boundary that talks to the real world. We use normal TypeScript `interface` types as ports and prefix them with `For`.

| Hex term | Role | In this monorepo |
| --- | --- | --- |
| **Port** | Contract at the edge of the interception "inside" | `For*` types in `lib/ports/` |
| **Adapter** | Implements a port by delegating to existing Cypress code | `*Adapter` classes under `packages/*/lib/adapters/` |
| **Driving port** (primary) | Outside actors **call into** interception — they drive the app | `ForInterceptRegistration` (driver IPC), `ForNetworkPolicyRegistration` (config) |
| **Driven port** (secondary) | Interception **calls out** for I/O and side effects | `ForRequestInterception`, `ForCookieState`, `ForCommandLog`, … |
| **Core** | Domain logic with no proxy/CDP imports; orchestrates ports | `NetworkPolicyCore` (stage 3; renamed `NetworkInterceptionCore` in stage 7) |
| **Composition root** | Where concrete adapters are constructed and injected | `createProxyRuntime()` in `packages/server/lib/network-runtime.ts` |

**Direction mnemonic:** *Driving* = something external drives work **in**. *Driven* = the core drives work **out** to infrastructure.

```
                    DRIVING PORTS (inbound)
              driver IPC          config policies
                    │                    │
                    ▼                    ▼
         ┌──────────────────────────────────────┐
         │  @packages/network-interception      │
         │  types · port interfaces · (later)   │
         │  core orchestration                  │
         └──────────────────────────────────────┘
                    │
                    │ calls driven ports
                    ▼
              DRIVEN PORTS (outbound)
    forward HTTP · cookies · HTML inject · command log · CDP (future)
                    │
                    ▼
         adapters in proxy / net-stubbing / driver
```

This package holds **ports and (later) core** — not adapters. Adapters stay in the package that owns the legacy implementation so we wrap rather than relocate thousands of lines at once.

**Dependency rule:** `@packages/network-interception` must not import `@packages/proxy` or `@packages/net-stubbing`. Adapters import ports; not the reverse.

---

## What stage 0 delivers

### Shared types (`lib/types/`)

`NetEvent`, route/handler types moved from net-stubbing. Net-stubbing re-exports for backward compatibility:

```typescript
export * from '@packages/network-interception/lib/types/external-types'
```

### Port stubs (`lib/ports/`)

All driving and driven ports are **declared**; methods are empty or minimal until later stack PRs. The names and file split (`driving-ports.ts` vs `driven-ports.ts`) follow hex primary/secondary port layout.

| Port | Hex kind | First adapter (stage) |
| --- | --- | --- |
| `ForInterceptRegistration` | Driving | `DriverInterceptRegistrationAdapter` (1) |
| `ForNetworkPolicyRegistration` | Driving | `ConfiguratorNetworkPolicyAdapter` (2) |
| `ForRequestInterception` | Driven | `ProxyRequestInterceptionAdapter` (4) |
| `ForResponseInterception` | Driven | (4) |
| `ForDocumentPreparation` | Driven | (5) |
| `ForNetworkCapture` | Driven | (6) |
| `ForCookieState` | Driven | (6) |
| `ForCommandLog` | Driven | (6) |
| `ForBrowserNetworkAutomation` | Driven | HTTP/2 epic (stub) |

### Runtime facade (`lib/runtime.ts`)

`NetworkInterceptionRuntime` — server-level handle so the composition root can eventually swap proxy-default vs browser-automation runtimes without rewriting `ServerBase`.

### Composition root extraction

`ServerBase` no longer constructs `NetworkProxy` inline; it calls `createProxyRuntime()`. Middleware stack and behavior are unchanged — this PR only names the wiring point where adapters will be injected in later stages.

---

## HTTP/2 and the driven-port boundary

Today, outbound HTTP uses the MITM proxy and Node `http.request` (via `ForRequestInterception.forwardToOrigin` once implemented in stage 4). The HTTP/2 path will use **different driven-port adapters** (CDP Fetch) for the same core. Driving ports (`cy.intercept` registration) stay the same.

---

## Stack roadmap

| Stage | Branch | Adds |
| --- | --- | --- |
| **0** | `refactor/ports-adapters-0` | Package, types, port stubs, composition root |
| 1 | `refactor/ports-adapters-1` | First driving-port adapter (driver IPC) |
| 2 | `refactor/ports-adapters-2` | Policy registry driving port |
| 3 | `refactor/ports-adapters-3` | Core extraction |
| 4–6 | … | Driven-port adapters (proxy, driver) |
| 7 | `refactor/ports-adapters-7` | Core rename, policy enforcement wired |

[#33919](https://github.com/cypress-io/cypress/issues/33919) has the full program diagram.

---

## Development

```bash
yarn workspace @packages/network-interception test
yarn workspace @packages/network-interception check-ts
yarn workspace @packages/server test-unit --grep network-runtime
```
