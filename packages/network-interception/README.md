# @packages/network-interception

Transport-agnostic center for Cypress network interception: **port interfaces**, the **`NetworkInterceptionCore`** orchestrator, the **policy registry**, and the shared types behind `cy.intercept`.

The package holds the interception *rules* — route matching, subscription planning, handler merge, injection-level and request-logging decisions, config policies. It holds none of the I/O. Everything transport-specific (MITM proxy middleware, CDP Fetch, driver IPC, cookie jar, Test Replay capture) lives behind an interface and is injected at a composition root.

`@packages/network-interception` must not import from `@packages/proxy` or `@packages/net-stubbing`. The dependency arrow only points inward.

---

## Why ports and adapters

Interception logic used to live inline in `@packages/proxy` and `@packages/net-stubbing` middleware, hard-wired to the MITM proxy. Cypress now runs the same matching, handler, and policy behavior over two different transports, so that logic had to stop depending on how bytes move.

The codebase uses **hexagonal architecture** (ports and adapters): keep the rules in a transport-agnostic center, isolate I/O behind interfaces, plug in a different implementation per transport.

| Hex term | Role | In this monorepo |
| --- | --- | --- |
| **Port** | Contract at the edge of the interception "inside" | `For*` types in `lib/ports/` |
| **Adapter** | Implements a port by delegating to transport-specific code | `*Adapter` classes under `packages/*/lib/adapters/` |
| **Driving port** (primary) | Outside actors **call into** interception | `ForInterceptRegistration`, `ForNetworkPolicyRegistration` |
| **Driven port** (secondary) | Interception **calls out** for I/O | `ForRequestInterception`, `ForCookieState`, … |
| **Core** | Domain orchestration, no transport imports | `NetworkInterceptionCore` (`lib/core/`) |
| **Composition root** | Constructs and injects adapters + core | `createProxyRuntime()` / `createCdpFetchRuntime()` (`packages/server/lib/network-runtime.ts`) |

---

## What lives here

### `lib/core/` — the pure center

| Module | Responsibility |
| --- | --- |
| `route-matching.ts` | `matchRoutes`, `doesRouteMatch`, `getMatchableForRequest`, CORS-preflight matching |
| `matcher-fields.ts` | Which `RouteMatcher` fields are string matchers |
| `plan-subscriptions.ts` | Which events each matched route subscribes to |
| `merge-handler-result.ts` | Merge driver handler results back into the request/response |
| `document-preparation.ts` | Injection-level and framebusting-removal decisions; shared content-type / `Accept` / service-worker predicates |
| `request-logging.ts` | Whether a request shows up in the command log |
| `http-intercept.ts` | `HttpIntercept` — the transport-agnostic middleware onion |
| `network-interception-core.ts` | `NetworkInterceptionCore` — delegates decisions to the pure modules and I/O to driven ports |

### Everything else

| Path | Contents |
| --- | --- |
| `lib/ports/driving-ports.ts` | `ForInterceptRegistration`, `ForNetworkPolicyRegistration` |
| `lib/ports/driven-ports.ts` | The six I/O ports plus the `ForBrowserNetworkAutomation` stub |
| `lib/ports/http-interception.ts` | `HttpRequest` / `HttpResponse`, `TransportCodecPort`, `InterceptMiddleware` |
| `lib/registry/` | `NetworkPolicyRegistry` — the default `ForNetworkPolicyRegistration` |
| `lib/policies/` | `NetworkPolicy` shape, the config policy factories, `registerDefaultNetworkPolicies()` |
| `lib/types/external-types.ts` | **Public API.** Copied verbatim to `cli/types/net-stubbing.d.ts` by `cli/scripts/sync-typedefs.ts` — changes here ship to users |
| `lib/types/internal-types.ts` | `NetEvent` driver↔server protocol, serializable prop lists |
| `lib/runtime.ts` | `NetworkInterceptionRuntime` facade (implemented by the proxy runtime) |

---

## Ports and their adapters

### Driving — outside calls in

| Port | Adapter | Package |
| --- | --- | --- |
| `ForInterceptRegistration` | `DriverInterceptRegistrationAdapter` | net-stubbing |
| `ForNetworkPolicyRegistration` | `ConfiguratorNetworkPolicyAdapter` | server |

### Driven — the core calls out

| Port | Adapter(s) | Responsibility |
| --- | --- | --- |
| `ForRequestInterception` | `ProxyRequestInterceptionAdapter` | Pre-request correlation, blocked-host termination |
| `ForResponseInterception` | `ProxyResponseInterceptionAdapter` | Response intercept continuation |
| `ForDocumentPreparation` | `ProxyDocumentPreparationAdapter` | Injection level, HTML inject, security stripping |
| `ForNetworkCapture` | `ProxyNetworkCaptureAdapter` | Test Replay / protocol capture |
| `ForCookieState` | `ProxyCookieStateAdapter` | Cookie jar attach and `Set-Cookie` capture |
| `ForCommandLog` | `ProxyCommandLogAdapter`, `DriverCommandLogAdapter` | Command-log entries |
| `ForBrowserNetworkAutomation` | *(none — see Known gaps)* | Reserved for browser network session hooks |

Middleware never calls an adapter directly; it calls `this.networkInterceptionCore.*` and the core routes to the injected port.

---

## One core, two transports

Cypress intercepts browser traffic either through the HTTP/1 MITM proxy or in the browser itself over CDP Fetch. `isBrowserNetworkMode()` (`packages/server/lib/util/network-mode.ts`) picks: Chromium-family browsers take the CDP path by default; `forceHttp1`, Firefox, WebKit, and Electron stay on the proxy.

Both paths run the same `HttpIntercept` middleware onion over the same core. What differs is the **codec** — a `TransportCodecPort` translating a transport's native request/response to and from the neutral `HttpRequest` / `HttpResponse` shape. Two codec roles are in play:

| Role | Purpose |
| --- | --- |
| Transport codec | Passed to `new HttpIntercept(codec)`; adapts whatever the transport hands in |
| Pipeline codec | Passed to `createLegacyProxyPipeline(codec)`; builds the legacy middleware context |

| Intercept | Transport codec | Pipeline codec |
| --- | --- | --- |
| Express / MITM proxy | `networkProxy.codec` — `http-codec.ts` (proxy) | same |
| CDP Fetch | `createCdpFetchCodec()` — `cdp-fetch-codec.ts` (server) | `createSyntheticProxyCodec()` — `synthetic-proxy-codec.ts` (proxy) |

In browser-network mode both intercepts exist: the CDP one handles browser traffic, while the Express one still serves internal routes and studio / cy-prompt forwards. They share middleware stages but stay distinct intercepts.

Because the CDP path drives `NetworkProxy` through a synthetic Express context, the legacy middleware stack — cookies, blocked hosts, rewriter, net-stubbing — runs unchanged on both transports.

### Composition roots

Both live in `packages/server/lib/network-runtime.ts` and are selected by `server-base.ts`. They share the same spine:

```
ConfiguratorNetworkPolicyAdapter      (driving port)
registerDefaultNetworkPolicies()
createProxyNetworkInterception()      (core + 6 driven-port adapters)
NetworkProxy                          (legacy middleware stack)
HttpIntercept(codec)                  (middleware onion)
```

`createProxyRuntime()` builds one intercept over the proxy codec and returns a `NetworkInterceptionRuntime`. `createCdpFetchRuntime()` builds the two intercepts above plus a `CdpFetchTransport`, and adds `start` / `stop` / `attachExtraTarget` for popup and service-worker sessions.

---

## Policies

Config-derived rules (`blockHosts`, `experimentalCspAllowList`, `modifyObstructiveCode`) are registered as `NetworkPolicy` objects at startup by `registerDefaultNetworkPolicies()` and evaluated by `NetworkPolicyRegistry`.

The request phase is live: proxy request middleware calls `core.endRequestIfBlocked()`, which runs the registry for `phase: 'request'`; a policy that calls `ctx.end()` stops the chain, and `blocked-hosts` puts its match in `ctx.state` for the adapter to turn into a 503.

---

## Known gaps

- **Response-phase policies never execute.** `runPolicies` is only ever called with `phase: 'request'`, so `csp-allow-list` and `document-rewrite` are registered but unreachable, and their `apply` is a no-op. CSP allow-listing and document rewriting are still enforced directly in proxy response middleware. The `'error'` phase has neither a policy nor a caller.
- **`ForBrowserNetworkAutomation` is an empty stub.** It was reserved for the browser-network path, but that path shipped through the `TransportCodecPort` seam instead, so nothing implements or supplies it.
- **`forwardToOrigin` is unreachable.** The port, the core method, and `ProxyRequestInterceptionAdapter.forwardToOrigin` are all in place, but the proxy calls `sendRequestOutgoing` directly from `http-codec.ts` instead of going through the core.

---

## Background

The ports-and-adapters refactor landed as an eight-PR stack tracked in [#33919](https://github.com/cypress-io/cypress/issues/33919) (closed). That issue is the design rationale; this file describes the result. Adapter-side notes live in [`packages/net-stubbing/lib/adapters/README.md`](../net-stubbing/lib/adapters/README.md) and [`packages/server/lib/adapters/README.md`](../server/lib/adapters/README.md).

---

## Development

```bash
yarn workspace @packages/network-interception test
yarn workspace @packages/net-stubbing test
yarn workspace @packages/proxy test
yarn workspace @packages/server test-unit -- network-runtime_spec
```

Behavioral coverage for `cy.intercept` itself lives in `packages/driver/cypress/e2e/commands/net_stubbing.cy.ts`, not in this package.
