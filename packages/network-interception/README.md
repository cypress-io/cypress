# @packages/network-interception

Shared types and **interface boundaries** for Cypress network interception — `cy.intercept`, config policies (`blockHosts`, CSP, rewrites), and the proxy middleware stack.

Part of the stacked refactor in [#33919](https://github.com/cypress-io/cypress/issues/33919). Goal: support HTTP/2 interception via CDP Fetch / BiDi **without rewriting** route matching, handler merge, or policy logic.

> **Stack stage 0 of 8.** Package scaffold only: shared types, interface stubs, and `createProxyRuntime()` composition root. **No behavior change** — proxy middleware and net-stubbing paths are unchanged; implementations come in later stages.

---

## Problem (today's code layout)

Intercept logic is spread across packages with tight coupling:

| Package | What it owns today |
| --- | --- |
| `@packages/proxy` | MITM proxy middleware — correlate pre-requests, forward to origin, inject HTML, cookies, command log |
| `@packages/net-stubbing` | Route matching, subscription handlers, driver IPC for `cy.intercept` |
| `@packages/server` | Wires `NetworkProxy`, sockets, config |

Everything assumes **one transport**: the browser sends traffic through Cypress's MITM proxy, and middleware calls Node HTTP to reach origins.

The HTTP/2 program adds a second path: the browser's own network stack (CDP Fetch / BiDi). Matching, fulfill, and policy rules must stay the same; only **where bytes move** changes.

---

## Approach: interfaces first, implementations stay put

This stage **does not move intercept logic**. It establishes:

1. **Shared types** — `NetEvent`, `BackendRoute`, handler shapes moved from net-stubbing into `lib/types/` (net-stubbing re-exports for backward compat)
2. **TypeScript interface stubs** — contracts in `lib/ports/` with no implementations yet
3. **Composition root** — `createProxyRuntime()` in `packages/server/lib/network-runtime.ts` extracts `NetworkProxy` construction from `ServerBase`

Implementations will live in the package that already owns the code:

```
packages/net-stubbing/lib/adapters/   → driver IPC (stage 1)
packages/proxy/lib/adapters/          → proxy middleware I/O (stages 4–6)
packages/server/lib/adapters/         → configurator policy registration (stage 2)
```

This package **must not** import from `@packages/proxy` or `@packages/net-stubbing`.

### Vocabulary (used throughout this stack)

| Term in this repo | Meaning |
| --- | --- |
| **Interface** (`For*` in `lib/ports/`) | A TypeScript interface describing one capability interception needs. |
| **Implementation / adapter** | A class elsewhere that `implements` the interface and calls existing functions. |
| **Inbound interface** | Outside → interception — e.g. driver sending `route:added`. `ForInterceptRegistration`, `ForNetworkPolicyRegistration`. |
| **Outbound interface** | Interception → side effects — e.g. forward HTTP, write cookies. `ForRequestInterception`, `ForCookieState`, etc. |
| **Core** (stage 3+) | Orchestrator with pure logic that calls outbound interfaces. |
| **Composition root** | Where implementations are wired — `createProxyRuntime()`. |

---

## What this stage adds

### Types (`lib/types/`)

Previously owned by `@packages/net-stubbing`. Moved here so both net-stubbing and future HTTP/2 code share one source of truth:

- `external-types.ts` — public `NetEvent`, route types (synced to CLI typedefs via `cli/scripts/sync-typedefs.ts`)
- `internal-types.ts` — server-side handler shapes
- `backend-route.ts` — route definition types

Net-stubbing files now re-export:

```typescript
// packages/net-stubbing/lib/external-types.ts
export * from '@packages/network-interception/lib/types/external-types'
```

### Interface stubs (`lib/ports/`)

All inbound and outbound interfaces are **declared but empty or minimal**. They document the planned boundary without changing call sites yet.

| Interface | Direction | Stage with first implementation |
| --- | --- | --- |
| `ForInterceptRegistration` | Inbound | 1 |
| `ForNetworkPolicyRegistration` | Inbound | 2 |
| `ForRequestInterception` | Outbound | 4 |
| `ForResponseInterception` | Outbound | 4 |
| `ForDocumentPreparation` | Outbound | 5 |
| `ForNetworkCapture` | Outbound | 6 |
| `ForCookieState` | Outbound | 6 |
| `ForCommandLog` | Outbound | 6 |
| `ForBrowserNetworkAutomation` | Outbound | HTTP/2 epic (stub) |

### Runtime facade (`lib/runtime.ts`)

```typescript
interface NetworkInterceptionRuntime {
  handleHttpRequest (req, res): Promise<void>
  setProtocolManager (protocolManager?): void
  reset (options?): void
  clearCredentials (): void
  addBrowserPreRequest (preRequest): Promise<void>
}
```

`createProxyRuntime()` returns this shape today by delegating to `NetworkProxy`. Later stages inject a core; HTTP/2 may swap the backing implementation without changing `ServerBase`'s call sites.

### Composition root change

**Before:** `ServerBase` constructed `NetworkProxy` inline.

**After:** `ServerBase` calls `createProxyRuntime(deps)` in `packages/server/lib/network-runtime.ts`.

Middleware stack, `defaultMiddleware`, and net-stubbing state are **identical** to pre-refactor behavior.

---

## HTTP/2: what will change vs what will not

**Will stay the same:** route tables, `cy.intercept` handlers, policy rules, command log semantics.

**Will change (later):** transport — MITM proxy vs CDP Fetch. Outbound method `ForRequestInterception.forwardToOrigin` (stage 4) is the documented split: proxy path uses Node HTTP; browser-automation path must not.

---

## Stacked PR roadmap

| Stage | Branch | Deliverable |
| --- | --- | --- |
| **0** | **`refactor/ports-adapters-0`** | **This PR — package, types, stubs, `createProxyRuntime`** |
| 1 | `refactor/ports-adapters-1` | Wire `ForInterceptRegistration` + driver adapter |
| 2 | `refactor/ports-adapters-2` | Policy registry + `BlockedHosts` registration |
| 3 | `refactor/ports-adapters-3` | `NetworkPolicyCore` pure orchestration |
| 4 | `refactor/ports-adapters-4` | Request/response outbound interfaces + proxy adapters |
| 5 | `refactor/ports-adapters-5` | Document prep + CSP/rewrite policies |
| 6 | `refactor/ports-adapters-6` | Capture, cookie, command-log adapters |
| 7 | `refactor/ports-adapters-7` | Rename core → `NetworkInterceptionCore`, wire enforcement |

Program overview: [#33919](https://github.com/cypress-io/cypress/issues/33919)

---

## Development

```bash
yarn workspace @packages/network-interception test
yarn workspace @packages/network-interception check-ts
yarn workspace @packages/network-interception lint
yarn workspace @packages/server test-unit --grep network-runtime
```
