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

- `lib/server/` — Server-side interception logic
  - `index.ts` — Entry point; registers the net-stubbing plugin with the proxy
  - `route-matching.ts` — Matches incoming requests against registered routes
  - `intercepted-request.ts` — Represents a request currently being intercepted
  - `driver-events.ts` — Handles events from the driver (browser) to the server
  - `state.ts` — Manages the server-side route and handler state
  - `util.ts`, `types.ts` — Server-specific utilities and types
- `lib/external-types.ts` — Public TypeScript types for users (e.g., `RouteMatcherOptions`, `StaticResponse`)
- `lib/internal-types.ts` — Internal protocol types shared between server and driver
- `lib/types.ts` — Re-exports and combined type definitions
- `lib/util.ts` — Shared utility functions

**Gotchas / Notes**

- Do not build `.js` files manually during development; `@packages/ts` provides require-time transpilation.
- End-to-end behavioral tests live in `@packages/driver` (`net_stubbing_spec`), not in this package's `test/` directory.
- The `lib/server/` entry point is what gets imported by `@packages/server`; the browser side is in `@packages/driver`.

**Integration Points**

- Loaded by `@packages/proxy` via `@packages/server` to intercept requests matching registered routes.
- Communicates with `@packages/driver` over `@packages/socket` to exchange route registrations and response stubs.
