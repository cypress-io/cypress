# Manual test: `HTTP_PROXY` is respected during Cypress install (#18330)

This guide verifies the fix in PR
[#34022](https://github.com/cypress-io/cypress/pull/34022): when only
`HTTP_PROXY` is set (no `HTTPS_PROXY`), the Cypress **binary download** during
install should be routed through the proxy. Before the fix it was ignored
because the download URL is `https://` and `proxy-from-env` only applies
`HTTP_PROXY` to `http://` URLs.

There are two ways to test:

- **Method A — End‑to‑end through a real proxy** (recommended; this is the true
  "in the wild" reproduction).
- **Method B — Patch a published Cypress** (no monorepo build required; closest
  to what an end user experiences).

A quick **resolver‑only sanity check** is included at the end.

---

## Prerequisites

- Node `>= 22.19.0` and Yarn `1.22.x` (only needed for Method A).
- A local HTTP proxy you can watch. Any of these work:
  - **Plain tunneling proxy (recommended for this test)** — forwards the
    `CONNECT` without touching TLS, so the download completes cleanly:
    - `DEBUG=proxy npx proxy --port 8080`, or
    - **tinyproxy** (`brew install tinyproxy` / `apt install tinyproxy`).
  - **mitmproxy** (`mitmdump`) — clearest request log, but it *intercepts* TLS
    and presents its own CA cert. See the TLS note below before using it.
    `brew install mitmproxy` / `pipx install mitmproxy`.
- A throwaway directory. **Do not** run this in a real project.

Throughout, the proxy listens on `127.0.0.1:8080`. Adjust if you pick another
port.

---

## Method A — End‑to‑end through a real proxy (from the PR branch)

### 1. Build the CLI from the branch

```bash
git checkout claude/cypress-http-proxy-issue-2aEOz
yarn            # install monorepo deps (first time only)
cd cli && yarn build && cd ..
```

### 2. Start a logging proxy (leave it running in its own terminal)

```bash
# Option 1: mitmproxy — prints every CONNECT
mitmdump --listen-port 8080

# Option 2: npx proxy
DEBUG=proxy npx proxy --port 8080
```

### 3. Run the install with ONLY `HTTP_PROXY` set

In a second terminal, from the repo root:

```bash
# isolate the cache so a real download actually happens
export CYPRESS_CACHE_FOLDER="$(mktemp -d)/cy-cache"

# the behavior under test:
export HTTP_PROXY=http://127.0.0.1:8080
unset HTTPS_PROXY                 # <-- the whole point: HTTPS_PROXY is NOT set
export NO_PROXY=""                # make sure nothing excludes download.cypress.io

# show how the proxy was resolved
export DEBUG=cypress:cli

# pin a real, published binary URL so the monorepo's 0.0.0-development version
# doesn't matter (proxy resolution still runs against download.cypress.io)
export CYPRESS_INSTALL_BINARY="https://download.cypress.io/desktop/13.15.0?platform=$(node -p 'process.platform')&arch=$(node -p 'process.arch')"

node cli/bin/cypress install --force
```

### 4. What success looks like ✅

1. In the **install** terminal, the debug line shows the proxy was picked up:

   ```
   cypress:cli Downloading package {
     url: 'https://download.cypress.io/desktop/13.15.0?...',
     proxy: 'http://127.0.0.1:8080',          <-- NOT null
     downloadDestination: '...'
   }
   ```

2. In the **proxy** terminal, you see a tunnel to the download host:

   ```
   CONNECT download.cypress.io:443
   ```

3. The download proceeds / completes through the proxy.

> **The `proxy:` value is the actual assertion.** Seeing
> `proxy: 'http://127.0.0.1:8080'` (instead of `proxy: null`) already proves the
> fix — that is the line that changes between this branch and `develop`. Whether
> the bytes finish downloading depends only on your proxy/TLS setup, not on the
> fix.

> **TLS note (mitmproxy).** If you used `mitmdump` and see
> `✖ unable to verify the first certificate`, that is **expected** and is *not* a
> problem with the fix — it actually confirms traffic is flowing through the
> proxy. mitmproxy terminates TLS and presents its own CA, which Node doesn't
> trust by default. To get a clean, completed download either:
> - point Node at mitmproxy's CA:
>   `export NODE_EXTRA_CA_CERTS="$HOME/.mitmproxy/mitmproxy-ca-cert.pem"`, or
> - use a plain tunneling proxy (`npx proxy` / tinyproxy), which never touches
>   TLS — recommended for this test, since we only care that the download is
>   *routed* through the proxy.

### 5. Confirm the bug exists without the fix (baseline)

Repeat steps 2–4 on `develop` (or `git stash` the change):

```bash
git checkout develop && cd cli && yarn build && cd ..
# ...same env exports as step 3...
node cli/bin/cypress install --force
```

You should now see `proxy: null` in the debug output and **no** `CONNECT` in
the proxy log. If direct internet egress is blocked (see "Airtight variant"),
the install fails with `getaddrinfo ENOTFOUND download.cypress.io` — exactly the
error from the original issue.

---

## Method B — Patch a published Cypress (no monorepo build)

This reproduces what a real user hits and applies the fix to an installed copy.

### 1. Create a throwaway project and install the npm package only

```bash
mkdir /tmp/cy-proxy-test && cd /tmp/cy-proxy-test
npm init -y
# install the JS package but skip the binary for now
CYPRESS_INSTALL_BINARY=0 npm install cypress@latest
```

### 2. Apply the fix to the installed file

Open `node_modules/cypress/lib/tasks/download.js` and find the
`getProxyForUrlWithNpmConfig` function. Replace its body so the HTTPS download
falls back to `HTTP_PROXY` (after npm's https‑proxy config). It will look
roughly like this — keep whatever local name the file uses for
`getProxyForUrl` (often `proxy_from_env_1.getProxyForUrl`):

```js
const getProxyForUrlWithNpmConfig = (url) => {
  const httpProxyFallback = url.startsWith('https:')
    ? getProxyForUrl(`http:${url.slice('https:'.length)}`)
    : ''

  return getProxyForUrl(url) ||
    process.env.npm_config_https_proxy ||
    httpProxyFallback ||
    process.env.npm_config_proxy ||
    null
}
```

> Tip: to make the patch reusable, run `npx patch-package cypress` after editing.

### 3. Install the binary through the proxy

```bash
export CYPRESS_CACHE_FOLDER="$(mktemp -d)/cy-cache"
export HTTP_PROXY=http://127.0.0.1:8080
unset HTTPS_PROXY
export NO_PROXY=""
export DEBUG=cypress:cli

npx cypress install --force
```

Verify the same success signals as **Method A, step 4**. To see the baseline
failure, undo the edit (`rm -rf node_modules && CYPRESS_INSTALL_BINARY=0 npm i`)
and rerun — the download will be bypassed (`proxy: null`).

---

## Bonus: verify proxy precedence (the Bugbot fix)

The installer must agree with the Cypress runtime: npm's `https-proxy` config
wins over the `HTTP_PROXY` fallback. With the build from Method A:

```bash
export DEBUG=cypress:cli
export HTTP_PROXY=http://127.0.0.1:8080            # shell HTTP proxy
export npm_config_https_proxy=http://127.0.0.1:9090 # npm https proxy (different!)
unset HTTPS_PROXY
export CYPRESS_INSTALL_BINARY="https://download.cypress.io/desktop/13.15.0?platform=$(node -p 'process.platform')&arch=$(node -p 'process.arch')"

node cli/bin/cypress install --force
```

Expected: the debug line shows `proxy: 'http://127.0.0.1:9090'` (npm https‑proxy
wins), **not** `:8080`.

---

## Quick resolver‑only sanity check (no network, no proxy)

If you just want to confirm the resolution logic from the branch build:

```bash
cd cli && yarn build && cd ..
HTTP_PROXY=http://foo node -e "
  const d = require('./cli/dist/tasks/download');
  console.log('https w/ only HTTP_PROXY =>', d.getProxyForUrlWithNpmConfig('https://download.cypress.io'));
  // expect: http://foo
"
```

Or run the unit tests that cover this:

```bash
yarn workspace cypress test-unit -- test/lib/tasks/download.spec.ts
```

---

## Airtight variant (optional, strongest proof)

To prove the download *only* works via the proxy, block direct egress to the
host so the proxy is the sole path:

- Temporarily add `127.0.0.1 download.cypress.io` to `/etc/hosts` **on a machine
  where the proxy resolves DNS itself** (e.g. mitmproxy in regular mode does its
  own resolution), or
- Use a firewall rule to drop direct outbound 443 to `download.cypress.io`.

With the fix: install succeeds (traffic goes through the proxy).
Without the fix: install fails with `getaddrinfo ENOTFOUND download.cypress.io`.

Remember to revert the `/etc/hosts` or firewall change afterward.

---

## Cleanup

```bash
rm -rf "$CYPRESS_CACHE_FOLDER" /tmp/cy-proxy-test
unset HTTP_PROXY HTTPS_PROXY NO_PROXY DEBUG CYPRESS_INSTALL_BINARY \
      CYPRESS_CACHE_FOLDER npm_config_https_proxy
# stop the proxy process (Ctrl-C in its terminal)
```

## Interpreting results

| Scenario | `proxy:` in debug | Proxy log `CONNECT` | Verdict |
| --- | --- | --- | --- |
| Fix + only `HTTP_PROXY` | `http://127.0.0.1:8080` | yes | ✅ fixed |
| `develop` + only `HTTP_PROXY` | `null` | no | ❌ reproduces #18330 |
| Fix + `npm_config_https_proxy` set | the npm https value | yes | ✅ matches runtime precedence |
