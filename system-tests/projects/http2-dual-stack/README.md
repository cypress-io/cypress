# http2-dual-stack

Standalone dual-stack HTTP/2 origin verifying that browser traffic negotiates
real h2 through Cypress when the MITM proxy is disabled, while the Cypress
commands that run server-side (`cy.visit`'s `resolve:url` pre-flight,
`cy.request`) keep working over HTTP/1.1 against the same origin.

This replaces the h2-only fixtures from #34165, which could not pass as
written: with `allowHTTP1: false` the `resolve:url` pre-flight was
ALPN-rejected before the browser ever navigated, and flipping `allowHTTP1: true`
crashed the in-process system-tests harness (Node's h1.1 compat path dies
under Express-over-`http2.createSecureServer` in the mocha process). Real h2
servers are dual-stack, so this origin is too — and it runs out-of-band as a
plain node script instead of inside the harness. See #34308.

## Running locally

```bash
# terminal 1 — the origin (self-signed certs are generated on first run)
node system-tests/projects/http2-dual-stack/server.mjs

# terminal 2 — h2 (proxy disabled): expect in-page fetches at HTTP/2.0
CYPRESS_INTERNAL_DISABLE_PROXY=1 yarn cypress:run \
  --project system-tests/projects/http2-dual-stack --browser chrome

# contrast — proxy enabled: the MITM terminates browser connections, so all
# browser traffic downgrades to HTTP/1.1
yarn cypress:run --project system-tests/projects/http2-dual-stack \
  --browser chrome --expose expectedBrowserProtocol=1.1
```

The server log shows the split directly: `resolve:url` and `cy.request`
arrive as `HTTP/1.1` lines while the browser's in-page fetches arrive as
`HTTP/2.0` (proxy disabled) or `HTTP/1.1` (proxy enabled). The visited
document itself never reaches the origin from the browser — `cy.visit`
buffers the `resolve:url` response and fulfills the navigation with it, so
the page always embeds `1.1` regardless of proxy mode.
