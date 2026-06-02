# @packages/network-interception

Types and **port interfaces** for Cypress network interception (`cy.intercept`, config policies, proxy middleware). Part of the stacked refactor in [#33919](https://github.com/cypress-io/cypress/issues/33919) to support HTTP/2 (CDP Fetch / BiDi) without rewriting intercept logic.

> **Stack stage 1 of 8.** First **driving port** wired: `ForInterceptRegistration` + `DriverInterceptRegistrationAdapter`. Driver→server `cy.intercept` IPC goes through the port; implementation still calls `onNetStubbingEvent`. **No behavior change.**

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

This package holds **ports and (later) core** — not adapters. **Dependency rule:** `@packages/network-interception` must not import `@packages/proxy` or `@packages/net-stubbing`.

---

## What stage 1 delivers

### Driving port: `ForInterceptRegistration`

**Port** (`lib/ports/driving-ports.ts`):

```typescript
interface ForInterceptRegistration {
  handleEvent (request: InterceptRegistrationRequest): Promise<unknown>
}
```

**Adapter:** `DriverInterceptRegistrationAdapter` in `packages/net-stubbing/lib/adapters/` — implements the port, delegates to `onNetStubbingEvent`.

**Call site:** `SocketBase` (`packages/server/lib/socket-base.ts`) receives driver `net` socket events and calls the port instead of importing net-stubbing handlers directly.

```
cy.intercept() → driver socket ('net')
  → SocketBase
  → ForInterceptRegistration.handleEvent({ eventName, frame })
  → DriverInterceptRegistrationAdapter
  → onNetStubbingEvent()
```

Adapter details: [`packages/net-stubbing/lib/adapters/README.md`](../net-stubbing/lib/adapters/README.md)

### Typed request shape

`InterceptRegistrationRequest` pairs `eventName` (`route:added` | `subscribe` | `event:handler:resolved` | `send:static:response`) with the existing `NetEvent.ToServer.DriverEvent` frame.

---

## Ports not yet wired (later stages)

| Port | Hex kind | Stage |
| --- | --- | --- |
| `ForNetworkPolicyRegistration` | Driving | 2 |
| `ForRequestInterception` / `ForResponseInterception` | Driven | 4 |
| `ForDocumentPreparation` | Driven | 5 |
| `ForNetworkCapture` / `ForCookieState` / `ForCommandLog` | Driven | 6 |
| `ForBrowserNetworkAutomation` | Driven | HTTP/2 epic |

---

## Stack roadmap

| Stage | Branch | Adds |
| --- | --- | --- |
| 0 | `refactor/ports-adapters-0` | Package, types, port stubs, composition root |
| **1** | **`refactor/ports-adapters-1`** | **First driving-port adapter (driver IPC)** |
| 2 | `refactor/ports-adapters-2` | Policy registry driving port |
| 3–7 | … | Core, driven-port adapters, enforcement |

[#33919](https://github.com/cypress-io/cypress/issues/33919)

---

## Development

```bash
yarn workspace @packages/network-interception build-prod
yarn workspace @packages/network-interception test
yarn workspace @packages/net-stubbing test
yarn workspace @packages/server test-unit --grep network-runtime
```

Compiled output lives in `cjs/` and `esm/` (gitignored). Source stays in `lib/`.
