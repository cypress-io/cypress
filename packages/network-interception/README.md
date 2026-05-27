# @packages/network-interception

Domain boundary for Cypress network interception. This package is the **hexagonal core** of the [ports-and-adapters refactor](https://github.com/cypress-io/cypress/issues/33919) that prepares `cy.intercept`, config policies, and proxy middleware for the HTTP/2 program.

> **Stack stage 0 of 8.** At this stage the package defines port interfaces and shared types only — no orchestration or adapters yet. Later stages add implementations behind these boundaries without changing user-facing APIs.

## Why this package exists

Today, intercept matching, document injection, cookie handling, and config policies are embedded in `@packages/proxy` and `@packages/net-stubbing` middleware. The HTTP/2 program needs to swap the MITM proxy transport for browser network APIs (CDP Fetch / BiDi) **without rewriting intercept logic**.

This package isolates:

| Concern | Location in this package |
| --- | --- |
| Shared protocol types (`NetEvent`, routes, handlers) | `lib/types/` |
| Port interfaces (driving + driven) | `lib/ports/` |
| Runtime facade for composition roots | `lib/runtime.ts` (`NetworkInterceptionRuntime`) |
| Pure orchestration (route match, policy phases) | *Stage 3 — `NetworkPolicyCore`* |
| Configurator policies (`blockHosts`, CSP, rewrite) | *Stage 2 — `lib/policies/`* |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  @packages/server — composition root (stage 0)               │
│  createProxyRuntime() in lib/network-runtime.ts              │
│    └─ NetworkProxy + defaultMiddleware (unchanged behavior)  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  @packages/network-interception (this package — stage 0)     │
│    • Port interfaces (stubs)                                 │
│    • Shared types moved from net-stubbing                    │
│    • NetworkInterceptionRuntime facade                       │
└──────────────────────────────────────────────────────────────┘
```

Adapters that **implement** ports live in the package that owns the legacy code (`net-stubbing`, `proxy`, `server`, `driver`). This package must **not** import from proxy or net-stubbing.

## Port model

### Driving ports (outside → domain)

Callers outside the domain initiate work.

| Port | Stage | Responsibility |
| --- | --- | --- |
| `ForInterceptRegistration` | 0 (stub) → 1 (adapter) | Driver→server IPC for `cy.intercept` |
| `ForNetworkPolicyRegistration` | 0 (stub) → 2 (registry) | Cypress configurator policies |

### Driven ports (domain → infrastructure)

The core delegates I/O and side effects to these interfaces.

| Port | Stage | Responsibility |
| --- | --- | --- |
| `ForRequestInterception` | 0 (stub) → 4 | Pre-request correlation, forward to origin |
| `ForResponseInterception` | 0 (stub) → 4 | Response intercept continuation |
| `ForDocumentPreparation` | 0 (stub) → 5 | HTML/JS injection, CSP strip |
| `ForNetworkCapture` | 0 (stub) → 6 | Test Replay / protocol capture |
| `ForCookieState` | 0 (stub) → 6 | Cookie jar read/write |
| `ForCommandLog` | 0 (stub) → 6 | Command log provenance |
| `ForBrowserNetworkAutomation` | 0 (stub) | CDP/BiDi hooks — HTTP/2 epic |

See `lib/ports/driving-ports.ts` and `lib/ports/driven-ports.ts`.

## HTTP/2 readiness

`NetworkInterceptionRuntime` is the composition-root facade. In stage 0, `createProxyRuntime()` in `@packages/server` constructs the proxy-default runtime. The HTTP/2 program will swap in a browser-automation runtime behind the same facade.

The key transport boundary — `ForRequestInterception.forwardToOrigin` — is documented in stage 4. Proxy middleware calls it today; the CDP Fetch path will not.

## Stacked PR roadmap

| Stage | Branch | What it adds to this package |
| --- | --- | --- |
| **0** (this PR) | `refactor/ports-adapters-0` | Package scaffold, types, port stubs, `createProxyRuntime` |
| 1 | `refactor/ports-adapters-1` | `ForInterceptRegistration` typed request shape |
| 2 | `refactor/ports-adapters-2` | Policy registry, `BlockedHosts` policy |
| 3 | `refactor/ports-adapters-3` | `NetworkPolicyCore` pure orchestration |
| 4 | `refactor/ports-adapters-4` | Driven port method signatures for request/response |
| 5 | `refactor/ports-adapters-5` | Document preparation core + CSP/rewrite policies |
| 6 | `refactor/ports-adapters-6` | Request logging core, command-log port types |
| 7 | `refactor/ports-adapters-7` | `NetworkInterceptionCore` rename, consolidate composition, wire policy enforcement |

Full program overview: https://github.com/cypress-io/cypress/issues/33919

## Development

```bash
yarn workspace @packages/network-interception test
yarn workspace @packages/network-interception check-ts
yarn workspace @packages/network-interception lint
```

Related composition root:

```bash
yarn workspace @packages/server test-unit --grep network-runtime
```
