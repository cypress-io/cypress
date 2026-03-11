# @packages/https-proxy

Acts as a dynamic TLS certificate authority so Cypress can intercept and inspect HTTPS traffic. It generates per-hostname certificates on the fly using `node-forge`, enabling the proxy to decrypt, modify, and re-encrypt bytes flowing between the browser and any HTTPS origin.

## Key Commands

```bash
# Run a specific test file (single-file parallelism disabled — see Gotchas)
yarn workspace @packages/https-proxy test -- test/unit/ca.spec.ts

# Run tests matching a glob pattern
yarn workspace @packages/https-proxy test -- "test/unit/**/*.spec.ts"

# Build CJS and ESM outputs
yarn workspace @packages/https-proxy build

# Regenerate test CA certificates
yarn workspace @packages/https-proxy regenerate:certs

# Type-check
yarn workspace @packages/https-proxy check-ts
```

## Architecture

```
lib/
  ca.ts       Certificate Authority: generates and caches per-hostname TLS certificates
  index.ts    Public entry point: creates and starts the proxy server
  proxy.ts    CONNECT-tunnel handler: intercepts TLS handshakes and injects CA cert
  server.ts   HTTP server wrapper used during testing
  util/
    parse.ts  Parses CONNECT request hostnames and ports
```

## Gotchas / Notes

- `proxy.spec.ts` and `server.spec.ts` cannot run in parallel because both bind to overlapping ports. The `test-unit` script uses `vitest run` without `--pool=forks`; the `test-debug` script explicitly passes `--no-file-parallelism`.
- Test helper certificates live in `test/helpers/certs/`. Regenerate them with `regenerate:certs` (requires OpenSSL in `$PATH`) when they expire or when the CA key needs to rotate.
- The `semaphore` package throttles concurrent certificate generation to avoid race conditions under high load.

## Integration Points

- Consumed by **@packages/proxy** and **@packages/server** which instantiate the HTTPS proxy server as part of the Cypress HTTP interception pipeline.
- Depends on **@packages/network** (dev dep) for HTTP agent utilities used in integration tests.
