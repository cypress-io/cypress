# HTTPS Proxy

This package is responsible for acting as a CA authority and generating dynamic certificates on the fly for outbound HTTPS connections.

This package enables Cypress to inspect and modify bytes coming in and out of the browser.

## Testing

```bash
yarn workspace @packages/https-proxy test
yarn workspace @packages/https-proxy test-watch
yarn workspace @packages/https-proxy test-debug
```
