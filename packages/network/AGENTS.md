# @packages/network

Node.js-only networking utilities used throughout the Cypress server-side stack. Provides a proxy-aware HTTP/HTTPS agent, CA certificate management, connection helpers, and utilities for blocked hosts and client certificate handling.

## Key Commands

```bash
# Run a specific test file
yarn workspace @packages/network test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/network test -- "<glob-pattern>"

# Build the CJS output (and type-check the ESM target)
yarn workspace @packages/network build

# Type-check
yarn workspace @packages/network check-ts
```

## Architecture

```
lib/
  agent.ts               HTTP/HTTPS proxy-aware agent: keepalive, upstream-proxy CONNECT tunnelling, per-URL client certs
  allow-destroy.ts       Wraps net.Server to add a .destroy() method that closes active sockets
  blocked.ts             Checks whether a URL is blocked by the Cypress blocklist config
  ca.ts                  Resolves extra CAs from npm_config_cafile / npm_config_ca / NODE_EXTRA_CA_CERTS
  client-certificates.ts Manages per-origin client TLS certificate configuration
  concat-stream.ts       Wraps concat-stream so it always yields a Buffer, even for an empty stream
  connect.ts             Socket helpers: DNS address resolution and retrying net/tls connections
  http-utils.ts          responseMustHaveEmptyBody, plus the lenient HTTP parser options for real-world traffic
  index.ts               Public entry point; re-exports every module except ca.ts, which is internal to agent.ts
```

## Gotchas / Notes

- This package is **Node.js only** — it uses `tls`, `dns`, `net`, `http`/`https` and `fs-extra` directly. For isomorphic networking utilities (browser + Node.js), use **@packages/network-tools** instead.
- Only `cjs/` is emitted. `tsconfig.esm.json` sets `noEmit`, so `build:esm` is an ESM-compatibility type-check — the `module` field points at an `esm/` build that is never produced, since every consumer is CommonJS.
- Tests use `vitest run`; the `test-debug` script enables `--inspect-brk` for breakpoint debugging.
- `test/unit/agent.spec.ts` serves on port 443 and resolves `localhost` over both IPv4 and IPv6, so it needs root and an IPv6 loopback. CI's `unit-tests` job enables IPv6 in Docker and runs the suite under `sudo`; without both, much of the agent suite fails on `EACCES` / `EAFNOSUPPORT`.

## Integration Points

- Consumed by **@packages/server**, **@packages/proxy**, **@packages/net-stubbing**, **@packages/https-proxy**, and **@packages/data-context** for all Node.js HTTP networking.
- Depends on **@packages/network-tools** for `stripProtocolAndDefaultPorts`, used by `blocked.ts`.
