# Spike — Token Scope & Inspect Endpoint Mount (Phase 2 prep)

**Status:** Resolved — already implemented during Phase 0
**Resolves:** `../design.md` §9.2
**Date:** 2026-04-22

---

## Question

The design doc §9.2 asked: should the inspect token gate **every** request to `/__launchpad/graphql`, or should we stand up a separate `/__inspect/graphql` mount with the same schema and only token-gate that mount?

- **Option 1:** Token required on `/__launchpad/graphql` (single mount).
- **Option 2:** New `/__inspect/graphql` mount with token middleware; leave `/__launchpad/graphql` unchanged.

The concern driving the question: existing Electron renderers (`packages/launchpad`, `packages/app`) already speak to `/__launchpad/graphql` with no token knowledge. Option 1 would break them unless we plumbed the token through.

## Finding: already resolved in Phase 0

Inspection of the current tree shows Option 2 **is already implemented**. The design doc §9.2 is stale.

### Evidence

| Artifact | Location |
|---|---|
| Two separate Express mounts, token middleware scoped to inspect | `packages/data-context/graphql/makeGraphQLServer.ts:118-119` — `app.use('/__inspect/graphql/:operationName?', originMiddleware, tokenMiddleware, graphQLHTTP)` |
| Token generation + storage on `coreData.servers.inspect` | `packages/data-context/src/actions/ServersActions.ts:57-109` |
| Descriptor cleanup clears `coreData.servers.inspect` | `ServersActions.ts:118-137` |
| CLI sends `X-Cypress-Inspect-Token` header | `cli/lib/tasks/inspect.ts` |
| CLI reads token from descriptor file | `cli/lib/util/instance-discovery.ts` |

### Consumers of `/__launchpad/graphql` (unaffected — no token needed)

- `packages/launchpad/src/main.ts` → `makeUrqlClient({ target: 'launchpad' })` in `packages/frontend-shared/src/graphql/urqlClient.ts`.
- `packages/app/src/main.ts` → `makeUrqlClient({ target: 'app', namespace, socketIoRoute })` (port/namespace from `getRunnerConfigFromWindow()`).
- Both use the unauthenticated `/__launchpad/graphql` mount. Origin middleware still applies for drive-by browser protection.

### Middleware pattern

Express-style composition:

```
app.use('/__launchpad/graphql/:operationName?', originMiddleware,                graphQLHTTP)
app.use('/__inspect/graphql/:operationName?',   originMiddleware, tokenMiddleware, graphQLHTTP)
```

Order: Origin check → token check → resolver. A foreign origin → `403` before token check ever runs.

## Residual risk (not blocking Phase 2, flag for later)

### WebSocket auth

`/__launchpad/graphql-ws` (see `makeGraphQLServer.ts` upgrade handler ~l.248-265) has **no token middleware**. Phase 2's `inspect run --wait` uses HTTP polling, so this is out of scope. But `inspect subscribe` (design doc §6 Phase 3 — stream `graphql-refetch` NDJSON) will need a plan: either add token check to the WS upgrade callback or stand up a parallel `/__inspect/graphql-ws` mount mirroring the HTTP split.

Recommendation when Phase 3 is planned: mirror the HTTP decision — separate `/__inspect/graphql-ws` mount with token check in `useServer()`'s `onConnect` hook.

## Action

1. Mark `../design.md` §9.2 as resolved — Option 2 adopted.
2. No code changes needed for Phase 2 in the auth layer.
