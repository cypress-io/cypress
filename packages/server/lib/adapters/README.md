# Server adapters

**Adapters** for `@packages/network-interception` driven ports owned by the server composition root.

See [`packages/network-interception/README.md`](../../network-interception/README.md).

---

## Network composition

The composition root is [`lib/server-base.ts`](../server-base.ts) `open()`:

```mermaid
flowchart LR
  OPEN["server-base open"]
  HI[HttpIntercept]
  CI[CyIntercept]
  NP[NetworkProxy]
  FETCH[CDPNetworkInterception]
  OPEN --> HI
  OPEN --> CI
  CI --> HI
  OPEN -->|proxy enabled| NP
  NP --> HI
  OP["open_project launch"] -->|proxy disabled| FETCH
  FETCH --> HI
```

| Step | Code | Result |
| --- | --- | --- |
| 1. Intercept stack | `createHttpInterceptStack(config, socket)` | `HttpIntercept` with blockHosts and `CyIntercept.middleware` |
| 2a. Proxy path | `createNetworkProxy()` when proxy enabled | `NetworkProxy.networkInterception` = shared `HttpIntercept`; driven ports on `networkServices` |
| 2b. CDP path | `open_project.launch()` when `CYPRESS_INTERNAL_DISABLE_PROXY=1` | Passes `server.networkInterception` to browser launch |

| Concern | Wiring |
| --- | --- |
| `HttpIntercept` stack | `createHttpInterceptStack()` in `open()` |
| `cy.intercept` routes + driver events | `CyIntercept` on the stack; `socket-base` calls `cyIntercept.handleDriverEvent` |
| Proxy driven ports | `createProxyNetworkServices()` when proxy is enabled |
| CDP transport | Same `HttpIntercept` instance — no second stack |

Config middleware (`blockHosts`) registers on `HttpIntercept` via `use()`. CSP allow-list runs in proxy response middleware (`OmitProblematicHeaders`). Document rewrite (`modifyObstructiveCode`, `experimentalModifyObstructiveThirdPartyCode`) is typed via {@link DocumentRewriteConfig} but enforced only on proxy response streaming middleware — not on CDP Fetch. See [CDP vs proxy](../../network-interception/README.md#cdp-vs-proxy-cypress_internal_disable_proxy1) in `@packages/network-interception`.

### Tests

- `packages/network-interception/test/unit/config-intercept-middleware.spec.ts`
- `packages/server/test/unit/server-base_spec.ts`
- `packages/server/test/unit/browsers/cdp-cy-intercept-integration_spec.ts`
- `packages/server/test/unit/open_project_spec.ts`

[#33919](https://github.com/cypress-io/cypress/issues/33919)
