# HttpIntercept Logging PR Plan

## Goal

Add the first behavior-neutral `HttpIntercept` middleware: minimal request/response debug logging. This PR targets `cacie/33851/http-intercept-handle` and should not change network behavior.

## Scope

- Keep the `HttpIntercept` codec and proxy origin-fetch routing from PR 1 unchanged.
- Add one neutral middleware in `@packages/network-interception`.
- Register that middleware in the `packages/server` composition root.
- Do not move `cy.intercept`, blocked-hosts, CSP stripping, or other proxy middleware into the onion.

## Implementation

1. Add a minimal debug middleware in `@packages/network-interception`.
   - Signature: `InterceptMiddleware`.
   - Log `request: <url>` before `next(req)`.
   - Await `next(req)`.
   - Log `response: <url> <statusCode>` after the response returns.
   - Return the response object unchanged.

2. Register the middleware in `packages/server/lib/network-runtime.ts`.
   - Composition root should read:

   ```ts
   const networkProxy = new NetworkProxy(...)
   const networkInterception = new HttpIntercept(networkProxy.codec)

   networkInterception.use(debugRequest)
   networkProxy.withIntercept(networkInterception)
   ```

3. Add focused unit coverage.
   - Middleware calls `next` with the same request.
   - Middleware returns the exact response from `next`.
   - Server network runtime still constructs a proxy runtime successfully.

## Verification

Minimum local bar before commit or push:

- `yarn check-ts`
- `yarn lint`
- Relevant unit suites for `@packages/network-interception`, `@packages/proxy`, and `@packages/server`

Sandbox limitation:

- Do not run e2e tests in the sandbox. When the local minimum bar is green, ask the user to run the `net_stubbing` e2e parity command outside the sandbox.
