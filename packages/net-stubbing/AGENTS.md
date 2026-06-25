This package contains the server-side code and shared type definitions for Cypress's network stubbing feature (`cy.intercept()`). The corresponding driver-side (browser) code lives in `@packages/driver`.

**Key Commands**

```bash
# Build TypeScript to JS
yarn workspace @packages/net-stubbing build-prod

# Run a specific test file
yarn workspace @packages/net-stubbing test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/net-stubbing test -- "<glob-pattern>"

# Type-check
yarn workspace @packages/net-stubbing check-ts
```

**Architecture**

- `lib/cy-intercept.ts` — `CyIntercept` class: route state, in-flight intercepts, driver socket I/O, and `HttpIntercept` middleware
- `lib/core/` — Route matching, subscriptions, static responses, merge-handler-result, in-flight intercept lifecycle
- `lib/driver-http-conversion.ts` — Driver socket message shapes and HTTP conversions
- `lib/server/` — Shared utilities (`util.ts`), `InterceptError`, and middleware helpers still used by the proxy path
- Shared protocol and public API types live in `@packages/network-interception` (public API types are copied to `cypress/types/net-stubbing` at CLI build time)

**Gotchas / Notes**

- Do not build `.js` files manually during development; `@packages/ts` provides require-time transpilation.
- End-to-end behavioral tests live in `@packages/driver` (`net_stubbing_spec`), not in this package's `test/` directory.
- `createHttpInterceptStack` in `@packages/server` wires `CyIntercept.middleware` onto the shared `HttpIntercept` onion.

**Integration Points**

- Loaded by `@packages/proxy` via `@packages/server` to intercept requests matching registered routes.
- Communicates with `@packages/driver` over `@packages/socket` to exchange route registrations and response stubs.
