# @packages/network-interception

Types and **port interfaces** for Cypress network interception (`cy.intercept`, config policies, proxy middleware). Part of the stacked refactor in [#33919](https://github.com/cypress-io/cypress/issues/33919) to support HTTP/2 (CDP Fetch / BiDi) without rewriting intercept logic.

> **Stack stage 2 of 8.** Second **driving port**: `ForNetworkPolicyRegistration`, `NetworkPolicyRegistry`, `BlockedHosts` registered at startup. Registry is populated; **proxy middleware does not call `runPolicies` yet** (stage 7).

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
| **Core** | Domain orchestration without transport imports | `NetworkPolicyCore` (stage 3) |
| **Composition root** | Constructs and injects adapters | `createProxyRuntime()` |

**Dependency rule:** this package must not import `@packages/proxy` or `@packages/net-stubbing`.

---

## What stage 2 delivers

### Policy registry (`lib/registry/network-policy-registry.ts`)

Configurator rules (`blockHosts`, later CSP and document rewrite) become **`NetworkPolicy`** objects in a registry instead of inline `if (config.blockHosts)` in middleware.

| API | Purpose |
| --- | --- |
| `add(policy)` | Register in insertion order |
| `getPolicies()` | Read registered list |
| `runPolicies({ phase, ctx, onContinue, onEnd })` | Evaluate policies for a request phase (wired in stage 7) |

### Driving port: `ForNetworkPolicyRegistration`

**Adapter:** `ConfiguratorNetworkPolicyAdapter` (`packages/server/lib/adapters/`) — wraps the registry.

**Startup:** `registerDefaultNetworkPolicies(adapter, config)` in `createProxyRuntime()` adds `BlockedHosts` from `config.blockHosts`.

```
createProxyRuntime()
  → ConfiguratorNetworkPolicyAdapter  (driving-port adapter)
  → registerDefaultNetworkPolicies()  → policies.add(BlockedHosts(...))
  → networkPolicyRegistration exposed on runtime (not yet used by middleware)
```

Server adapter details: [`packages/server/lib/adapters/README.md`](../../server/lib/adapters/README.md)

### Stage 1 recap

`ForInterceptRegistration` + `DriverInterceptRegistrationAdapter` — [`packages/net-stubbing/lib/adapters/README.md`](../net-stubbing/lib/adapters/README.md)

---

## Stack roadmap

| Stage | Branch | Adds |
| --- | --- | --- |
| 0–1 | … | Package, driver driving port |
| **2** | **`refactor/ports-adapters-2`** | **Policy registry + `BlockedHosts` registration** |
| 3 | `refactor/ports-adapters-3` | Core extraction |
| 4–6 | … | Driven-port adapters |
| 7 | `refactor/ports-adapters-7` | `runPolicies` enforcement in middleware |

[#33919](https://github.com/cypress-io/cypress/issues/33919)

---

## Development

```bash
yarn workspace @packages/network-interception test
yarn workspace @packages/server test-unit --grep "configurator-network-policy|register-default|network-runtime"
```
