# @packages/network-interception

Types and **port interfaces** for Cypress network interception (`cy.intercept`, config policies, proxy middleware). Part of the stacked refactor in [#33919](https://github.com/cypress-io/cypress/issues/33919) to support HTTP/2 (CDP Fetch / BiDi) without rewriting intercept logic.

> **Stack stage 2 of 8.** Driving port `ForNetworkPolicyRegistration`, default impl `NetworkPolicyRegistry`. `@packages/server` defines and registers config policies (e.g. `createBlockedHosts()`) at startup. Registry is populated; **proxy middleware does not call `runPolicies` yet** (stage 7).

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
| **Driving port** (primary) | Outside actors **call into** interception — they drive the app | `ForInterceptRegistration` (driver IPC), `ForNetworkPolicyRegistration` (server config) |
| **Driven port** (secondary) | Interception **calls out** for I/O and side effects | `ForRequestInterception`, `ForCookieState`, `ForCommandLog`, … |
| **Core** | Domain logic with no proxy/CDP imports; orchestrates ports | `NetworkPolicyCore` (stage 3; renamed `NetworkInterceptionCore` in stage 7) |
| **Composition root** | Where concrete adapters are constructed and injected | `createProxyRuntime()` in `packages/server/lib/network-runtime.ts` |

**Direction mnemonic:** *Driving* = something external drives work **in**. *Driven* = the core drives work **out** to infrastructure.

This package holds **ports and (later) core** — not adapters. **Dependency rule:** `@packages/network-interception` must not import `@packages/proxy` or `@packages/net-stubbing`.

**Config vs test intercepts:** both match proxied traffic, but differ by **who drives registration**. Test intercepts use `ForInterceptRegistration` (driver IPC). Config rules use `ForNetworkPolicyRegistration` — the port interface lives here; **`@packages/server` owns the config → policy mapping** via `registerDefaultNetworkPolicies()`.

---

## What stage 2 delivers

### Driving port: `ForNetworkPolicyRegistration`

Exported from this package so `@packages/server` knows how to register configurator policies without importing registry internals.

| Method | Purpose |
| --- | --- |
| `add(policy)` | Register in insertion order |
| `getPolicies()` | Read registered list |

**Default implementation:** `NetworkPolicyRegistry` (also owns `runPolicies`, wired in stage 7).

**Server-owned policies:** `@packages/server` defines configurator policy factories (e.g. `createBlockedHosts()` in `lib/network-policies/`) and registers them via `registerDefaultNetworkPolicies(policies, config)`. This package accepts any value conforming to `NetworkPolicy`.

```
createProxyRuntime()  (@packages/server)
  → networkPolicyRegistration: ForNetworkPolicyRegistration = new NetworkPolicyRegistry()
  → registerDefaultNetworkPolicies(networkPolicyRegistration, config)
  → networkPolicyRegistration exposed on runtime (not yet used by middleware)
```

### Policy runner (`NetworkPolicyRegistry.runPolicies`)

| API | Purpose |
| --- | --- |
| `runPolicies({ phase, exchange, onContinue, onEnd })` | Evaluate policies for a request phase (wired in stage 7) |

`ctx.continue()` is intentionally a no-op — chain advancement is implicit via the loop. `onContinue` / `onEnd` fire at the runner boundary when middleware is wired in stage 7.

### Stage 1 recap

`ForInterceptRegistration` + `DriverInterceptRegistrationAdapter` — [`packages/net-stubbing/lib/adapters/README.md`](../net-stubbing/lib/adapters/README.md)

---

## Ports not yet wired (later stages)

| Port | Hex kind | Stage |
| --- | --- | --- |
| `ForRequestInterception` / `ForResponseInterception` | Driven | 4 |
| `ForDocumentPreparation` | Driven | 5 |
| `ForNetworkCapture` / `ForCookieState` / `ForCommandLog` | Driven | 6 |
| `ForBrowserNetworkAutomation` | Driven | HTTP/2 epic |

---

## Stack roadmap

| Stage | Branch | Adds |
| --- | --- | --- |
| 0–1 | … | Package, driver driving port |
| **2** | **`refactor/ports-adapters-2`** | **Policy driving port + registry + server-side registration** |
| 3 | `refactor/ports-adapters-3` | Core extraction |
| 4–6 | … | Driven-port adapters |
| 7 | `refactor/ports-adapters-7` | `runPolicies` enforcement in middleware |

[#33919](https://github.com/cypress-io/cypress/issues/33919)

---

## Development

```bash
yarn workspace @packages/network-interception build-prod
yarn workspace @packages/network-interception test
yarn workspace @packages/net-stubbing test
yarn workspace @packages/server test-unit --grep "blocked-hosts|register-default|network-runtime"
```

Compiled output lives in `cjs/` and `esm/` (gitignored). Source stays in `lib/`.
