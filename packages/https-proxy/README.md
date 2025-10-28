# HTTPS Proxy

This package is responsible for acting as a CA authority and generating dynamic certificates on the fly for outbound HTTPS connections.

This package enables Cypress to inspect and modify bytes coming in and out of the browser.

## Testing

Since `vitest` runs specs in parallel by default, we get collisions in the `proxy.spec.ts` and `server.spec.ts` as there is a proxy server running in the background for `proxy.spec.ts` while we are testing the implements of `server.spec.ts`. These tests cannot run at the same time, hence why we leverage the `no-file-parallelism` option.

```bash
yarn workspace @packages/https-proxy test
yarn workspace @packages/https-proxy test-watch
yarn workspace @packages/https-proxy test-debug
```
