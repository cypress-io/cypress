This package implements Cypress's HTTP interception proxy. It sits between the browser and the network, intercepting every request and response to enable test assertions, stubbing, and rewriting.

**Key Commands**

```bash
# Build TypeScript to JS
yarn workspace @packages/proxy build-prod

# Run a specific test file
yarn workspace @packages/proxy test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/proxy test -- "<glob-pattern>"

# Type-check without emitting
yarn workspace @packages/proxy check-ts
```

**Architecture**

- `lib/http/` — Core middleware pipeline for request/response interception
  - `request-middleware.ts` — Manipulates outgoing HTTP requests from the browser
  - `response-middleware.ts` — Manipulates HTTP responses before they reach the browser
  - `error-middleware.ts` — Handles errors occurring in the request/response cycle
- `lib/network-proxy.ts` — Top-level proxy orchestration class
- `lib/resourceTypeAndCredentialManager.ts` — Tracks resource types and credentials per request
- `lib/types.ts` — Shared TypeScript types for the proxy layer

**Gotchas / Notes**

- Do not build `.js` files manually during development; `@packages/ts` handles require-time transpilation.
- High-level debug logs: `DEBUG=cypress:proxy:*`
- Detailed per-request logs: `DEBUG=cypress-verbose:proxy:http`
- Integration tests live in `@packages/server`, not only in this package's `test/` directory.

**Integration Points**

- Used by `@packages/server` as the core HTTP interception layer.
- Depends on `@packages/rewriter` to transform JS/HTML response bodies.
- Depends on `@packages/net-stubbing` for `cy.intercept()` route matching.
- Depends on `@packages/socket` for real-time communication with the browser.
