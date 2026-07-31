# @packages/network

Node.js-only networking utilities used throughout the Cypress server-side stack. Provides a proxy-aware HTTP/HTTPS agent, CA certificate management, connection helpers, and utilities for blocked hosts and client certificate handling.

## Key Commands

```bash
# Run a specific test file
yarn workspace @packages/network test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/network test -- "<glob-pattern>"

# Build CJS and ESM outputs
yarn workspace @packages/network build

# Type-check
yarn workspace @packages/network check-ts
```

## Architecture

```
lib/
  agent.ts               HTTP/HTTPS proxy-aware agent with keepalive support (uses node-forge for TLS)
  allow-destroy.ts       Wraps net.Server to add a .destroy() method that closes active sockets
  blocked.ts             Checks whether a URL is blocked by the Cypress blocklist config
  ca.ts                  CA certificate loading and trust store management
  client-certificates.ts Manages per-origin client TLS certificate configuration
  concat-stream.ts       Re-exports concat-stream for use in the proxy pipeline
  connect.ts             HTTP CONNECT tunnel helpers
  http-utils.ts          HTTP response/request utilities (header manipulation, stream helpers)
  index.ts               Public entry point re-exporting all modules
```

## Gotchas / Notes

- This package is **Node.js only** — it imports `node-forge`, `fs-extra`, and other Node.js APIs directly. For isomorphic networking utilities (browser + Node.js), use **@packages/network-tools** instead.
- Builds to both `cjs/` and `esm/`; the `module` field points to the ESM build for modern bundlers.
- Tests use `vitest run`; the `test-debug` script enables `--inspect-brk` for breakpoint debugging.

## Integration Points

- Consumed by **@packages/server**, **@packages/proxy**, **@packages/https-proxy**, and **@packages/rewriter** for all Node.js HTTP networking.
- **@packages/network-tools** depends on this package (dev dep) in its test suite.
