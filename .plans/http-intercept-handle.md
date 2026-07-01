# HttpIntercept.handle PR Plan

## Goal

Route every proxy origin fetch through a transport-typed `HttpIntercept.handle()` with an empty onion. The change is behavior-neutral: `cy.intercept`, blocked-hosts, CSP stripping, request middleware ordering, and response middleware ordering stay as they are on `develop`.

This PR targets `develop`. The follow-up logging PR will target this branch.

## Constraints

- Build from `develop`; do not reuse the `refactor/http-intercept-mw` WIP.
- Keep blocked-hosts as proxy request middleware and CSP stripping as proxy response middleware.
- Keep `cy.intercept` wired as today's proxy middleware. The CyIntercept onion middleware is explicitly deferred until the surrounding proxy middleware are also ported to the onion architecture.
- The proxy may import neutral `HttpRequest`/`HttpResponse` types to build its codec, but `handle()` and `next()` must stay transport-typed.

## Implementation

1. Add `HttpIntercept<TReq, TRes>` and HTTP interception ports to `@packages/network-interception`.
   - `HttpTransportCodec<TReq, TRes>` maps proxy transport values to/from neutral `HttpRequest` and `HttpResponse`.
   - `use()` registers neutral `InterceptMiddleware`.
   - `handle(transportReq, next)` decodes the request, composes middleware, applies request mutations to the transport request at the terminal boundary, calls `next(transportReq)`, decodes the transport response, then encodes the final neutral response back to `TRes`.
   - Unit tests cover empty pass-through, middleware ordering, request mutation propagation, and response mutation round-tripping.

2. Add proxy codec adapters in `@packages/proxy`.
   - Convert `RequestInterceptionMiddlewareCtx` to neutral `HttpRequest`, including lazy request body materialization.
   - Apply neutral request mutations back onto the live proxy request before origin forwarding.
   - Convert origin `{ incomingRes, bodyStream }` values to neutral `HttpResponse` and back.
   - Preserve streaming behavior when no middleware replaces the response body.

3. Wire the empty onion into the proxy path.
   - `NetworkProxy` exposes `codec` and `withIntercept(http)`.
   - `Http` stores the configured `ForNetworkInterception`.
   - Request middleware adds `ApplyHttpInterception` immediately before the existing origin-forwarding step.
   - `packages/server/lib/network-runtime.ts` owns composition: create `NetworkProxy`, create `HttpIntercept(networkProxy.codec)`, then call `networkProxy.withIntercept(http)`.

## Verification

Minimum local bar before commit or push:

- `yarn check-ts`
- `yarn lint`
- Relevant unit suites for `@packages/network-interception`, `@packages/proxy`, and `@packages/server`

Sandbox limitation:

- Do not run e2e tests in the sandbox. When the local minimum bar is green, ask the user to run the proxy integration and `net_stubbing` e2e parity commands.
