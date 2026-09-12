# Security Review Notes

Long-form companion to [`.claude/claude-security-guidance.md`](../.claude/claude-security-guidance.md),
which the [`security-guidance`](https://code.claude.com/docs/en/security-guidance)
plugin loads as review context. That file is capped at 8 KB, so it carries only
the highest-leverage rules and points here for the rest.

This is a reviewer's map of the monorepo's trust boundaries and the invariants
that hold them together. It is written for humans and for agents asked to review
a change; it is not a vulnerability list, and it does not replace
`/security-review`, Snyk, or the PR-time review.


Cypress deliberately does things a normal web app must never do: it terminates
TLS for the app under test, strips its security headers, evaluates user-authored
code, and runs a privileged Electron process next to attacker-influenced page
content. "This disables a security control" is often correct here. The question
is always **which side of a trust boundary it is on**.

- **Untrusted**: the AUT — responses, DOM, cookies, `Set-Cookie`; anything over
  `postMessage` from an AUT frame; any `x-cypress-*` request header (same-origin
  AUT script can set these); a forged `Host` or `Referer`; a page script talking
  to the extension; GitHub issue and PR text.
- **Semi-trusted**: the user's project — config, specs, plugin code, fixtures,
  `package.json` `config`. It must not escalate past Cypress itself.
- **Trusted**: the Electron main process, the server, the launchpad/app origin,
  release tooling and CI credentials.

Serious means untrusted data crossing into trusted, or a control protecting the
*user's own* connection or machine being weakened.

## Deliberate exceptions — do not "fix" these

Flag only a change that widens their reach.

- Running user code is the product: `driver/src/cypress/script_utils.ts` (spec
  contents), `driver/src/cross-origin/origin_fn.ts` (the `cy.origin()` callback),
  `server/lib/plugins/child/` (the user's config).
- `proxy/lib/http/util/regex-rewriter.ts` rewrites obstructive `top`/`parent`
  code and strips SRI `integrity`; `adapters/remove-security.ts` is only the
  gate; headers are dropped in `response-middleware.ts`. HSTS is deliberately
  never stripped — do not add it.
- `@packages/https-proxy` intercepts AUT TLS. `server/lib/request.ts` sets
  `NODE_TLS_REJECT_UNAUTHORIZED=0` process-wide and `util/suppress_warnings.ts`
  hides the warning — do not widen that filter. Calls to Cypress-owned services
  must use `strictAgent` from `network/lib/agent.ts`.
- `socket/lib/utils.ts` lifts socket.io-parser's `maxAttachments` DoS cap,
  justified as "two trusted local processes" — widening who can reach that socket
  invalidates the justification and must be raised.

## Origin comparison

- `toFileServerUrl` (`network-tools/lib/remote-states.ts`) is the reference, and
  its comment says why: compare `URL.origin`, never a string prefix, because a
  prefix treats `http://localhost:2020@evil.com` as under the file origin.
- Two gates still use `startsWith`: `urlMatchesOriginProtectionSpace`
  (`network-tools/lib/cors.ts`), which mints `Authorization: Basic`, and
  `reqMatchesPolicyBasedOnDomain` (`proxy/lib/http/util/document-preparation.ts`),
  which feeds injection level. `extension/app/v3/service-worker.ts` matches tabs
  with `tab.url.includes(url)`.
- The `TypeError` fallbacks in `uri.ts` and `cors.ts` must keep returning a
  *recovered authority*, never raw input, or distinct malformed URLs collapse
  into one parsed object and compare same-origin. Never widen those `catch`es.
- `allowPrivateDomains` (`parse-domain.ts`) keeps two tenants on a shared host in
  separate super-domains; callers must pass a hostname, not a URL.
- `experimentalModifyObstructiveThirdPartyCode` (third-party only) and
  `removeSRIAttributes` (first-party only) are scoped by expressions duplicated
  in `remove-security.ts` **and** `inject-html.ts`. Changing one diverges the
  stream and in-memory paths.

## Inline script payloads

`privileged-commands-manager.ts` has the correct escaper,
`serializeForInlineScript` (`<`, `>`, U+2028, U+2029). Use it for every value
interpolated into an inline `<script>`. `JSON.stringify` alone is **not** enough:
it does not escape `<`, `>`, or `/`, so a value containing `</script>` closes the
element.

- `proxy/lib/http/util/inject.ts` — payload carries `simulatedCookies` from the
  origin's own `Set-Cookie`, and `document.domain` from `getSuperDomain`.
- `data-context/src/sources/HtmlDataSource.ts` — spec filenames, `projectName`,
  `namespace`.
- `socket/lib/node/cdp-socket.ts` hand-rolls quote escaping into a
  `Runtime.evaluate` expression; prefer `callFunctionOn` with `arguments`. Keep
  the builders in `automation/commands/` numeric or boolean.
- `extension/lib/index.ts` substitutes `socketIoRoute` into a JS file written to
  disk and loaded as an extension — JSON-encode it.

## Headers

- `PatchExpressSetHeader` writes into Node's internal header map to bypass
  `ERR_INVALID_CHAR`, and `insecureHTTPParser: true` is set in
  `network/lib/http-utils.ts`. Header injection and smuggling are the live risk
  class in the proxy; treat widening as high severity. Keep
  `OmitProblematicHeaders` ordered before `SetInjectionLevel`.
- `x-cypress-*` headers carry trust decisions (`isAUTFrame` drives cookie
  attachment and injection level), so each must be deleted before passthrough.
- `x-cypress-internal-loopback-token` gates `proxiedUrl` override and force-proxy
  bypass: **every new passthrough path must strip it.** The comments in
  `adapters/internal-routes.ts` and `serve-internal-routes.ts` explain why header
  presence alone is never sufficient.

## Local endpoints and tokens

- `/__launchpad/*` is protected by `corsOriginDelegate.ts` (loopback host **and**
  matching port) across CORS, socket.io `allowRequest`, and the `graphql-ws`
  upgrade. `/__cypress/graphql` and the driver socket.io server have no
  equivalent check and both reach privileged handlers. New routes or socket
  events there need an origin or token check.
- Do not treat `socketId` as authentication — no handler requires it.
- Token comparisons in `file_server.ts`, `internal-routes.ts`,
  `privileged-commands-manager.ts` and `cloud/auth.ts` use `!==`; new ones should
  use `crypto.timingSafeEqual`, with tokens from `crypto.randomBytes` rather than
  `util/random.ts`'s reduced lowercase charset. Never log an expected token or an
  `access_token`.

## Reaching the OS

- `shell.openExternal` (`gui/links.ts`) and the editor launch
  (`util/file-opener.ts`, `actions/FileActions.ts`, which pass `"${binary}"` as a
  quoted string and hit `cmd.exe /C` on Windows) are the two paths from a socket
  message to process execution. Validate the scheme, validate the editor against
  the discovered `availableEditors`, prefer argv arrays. `socket-base.ts` already
  overrides the front-end-supplied `fileDetails.where` server-side for this
  reason — extend that distrust, don't narrow it.
- Browser launch and `execa` need argv arrays whenever an element derives from a
  project path, browser argument, spec name, or env var. Assert
  `Number.isInteger(pid)` at the `execAsync` sites in `browsers/index.ts` and
  `cloud/environment.ts`. Sanitize `downloadItem.getFilename()` with
  `path.basename` before joining.

## Electron renderer privileges

`gui/windows.ts` defaults to `webSecurity: true`, `nodeIntegration: false`,
`contextIsolation: true`, but `create()` merges with `_.defaultsDeep` and then
unconditionally overwrites `webSecurity` from `chromeWebSecurity`. Force these
keys *after* the merge so a caller cannot opt out, and derive `webSecurity` from
config only for AUT windows. Keep `setWindowOpenHandler` returning `deny`. A new
`preload` needs `contextIsolation` plus `sandbox` and a hand-written
`contextBridge` allowlist, never raw `require` or `process`. The GUI window's
origin must stay loopback.

## Dynamically evaluated and remote code

`cloud/require_script.ts` compiles remote scripts; the trust chain is signature
verification in `cloud/api/index.ts` then a signed manifest with per-file sha256
allowlisting in `bundles/verify_bundle_on_disk.ts`. Preserve both halves.
`cloud/encryption.ts` picks the public key by env and defaults to `development` —
an unknown env should fail loudly, not index `undefined`. The
`CYPRESS_LOCAL_*_PATH` variables bypass verification: do not add another, and do
not let one become reachable in a shipped binary. `server/lib/fixture.ts` still
`eval`s `.js` fixture contents in the privileged server process.

## The plugins IPC boundary

Everything crossing back is semi-trusted: never `eval` it, never interpolate it
into a shell string, confine any path it supplies to the project root, and
validate fields consumed as a path, executable, or route *after* the hop.
`ProjectConfigIpc` concatenates `NODE_OPTIONS` by hand from
`ORIGINAL_NODE_OPTIONS` — treat that as untrusted and keep loader flags out. This
code runs on the *user's* Node; check the runtime floors in `AGENTS.md`.

## Cookies and CORS

Scope decisions live in `proxy/lib/http/util/cookies.ts` and
`server/lib/automation/cookie/`. Watch for `hostOnly` widening to all subdomains
when `undefined` is coerced to `false` on an automation round-trip; the
`tough.domainMatch` rejection in `server/lib/request.ts`; and the
per-redirect-hop re-derivation, where dropping half sends origin A's cookies to
origin B. New `res.cookie` calls in the proxy must go through the `setCookie`
helper, which omits `Domain` for IPv6 literals. `net-stubbing` reflects the
request `Origin` with `access-control-allow-credentials: true` — acceptable only
while gated to matched/stubbed responses.

## AUT content reaching privileged UI

`reifyDomElement` (`driver/src/util/serialization/log.ts`) assigns `innerHTML`
from a `postMessage`d payload that originated in the AUT. Widening that path —
more tags, event-handler attributes, `<script>`, `srcdoc`, `javascript:` URLs —
is script execution in the runner's own origin; attribute allowlisting is the
control. In `extension/app/v3/content.ts` the only check on inbound messages is
`source !== window`, which any script on the page satisfies.

## Credentials

Record keys and auth tokens must pass through `hideKeys()` from
`@packages/config` before reaching a log, error, snapshot, or telemetry attribute
— `server/lib/modes/record.ts` does this. It reveals 10 characters, so it suits a
high-entropy key and nothing shorter. Snapshots under
`packages/errors/test/__snapshots__` are committed, so pass a picked subset into
an error, never the whole config. `HtmlDataSource.ts`'s `delete cfg.env` is the
load-bearing scrub before config reaches the browser. Cloud request logging is
deliberately body-free. New secret files should be `0o600`.

## Install path

`verifyDownloadedFile` (`cli/lib/tasks/download.ts`) compares against
`x-amz-meta-*` headers from the same response and returns successfully when they
are absent, so it detects corruption, not a malicious mirror — fail closed rather
than loosening it. `CYPRESS_DOWNLOAD_MIRROR`, `CYPRESS_DOWNLOAD_PATH_TEMPLATE`
and `CYPRESS_INSTALL_BINARY` accept plain `http:` and are read via `util.getEnv`,
which also honours `npm_package_config_*`, so an untrusted repo's `package.json`
can redirect the download. Re-check the scheme on each redirect hop.
`extract-with-yauzl.ts` is hardened (traversal check, symlink confinement, size
cap); the `unzip`/`ditto` paths are not. In `https-proxy/lib/ca.ts`, changing cert
format, key size, or algorithm requires bumping `CA_VERSION`.

## Workflows

`.github/workflows/` holds real credentials, and `triage_handle_new_comments.yml`
triggers on `issue_comment`, so comment text is attacker-controlled. Never
interpolate `github.event.*` text into a `run:` block — bind it to an `env:` var
and quote the expansion. Scrutinise any move to `pull_request_target`, any
widening of `permissions:`, and any action not pinned to a commit SHA.

## Two last things

A PR that **deletes an existing security comment** in these files is a red flag:
they encode invariants not visible in the code.

Fixtures under `system-tests/projects/**` and `driver/cypress/fixtures/**`
contain intentionally unsafe HTML, and `packages/server/test/**` disables TLS
verification on purpose. Do not report those.
