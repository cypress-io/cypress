# HTTPS Proxy

This package is responsible for acting as a CA authority and generating dynamic certificates on the fly for outbound HTTPS connections.

This package enables Cypress to inspect and modify bytes coming in and out of the browser.

## Testing

```bash
yarn lerna run test --scope @packages/https-proxy --stream
yarn lerna run test-watch --scope @packages/https-proxy --stream
yarn lerna run test-debug --scope @packages/https-proxy --stream
```
