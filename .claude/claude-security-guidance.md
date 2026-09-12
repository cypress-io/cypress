# Security guidance for the Cypress monorepo

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

Areas this file omits for space are in `guides/security-review-notes.md`.

## By design — do not report these

Flag only a change that widens their reach.

- Running user code is the product: `driver/src/cypress/script_utils.ts`,
  `driver/src/cross-origin/origin_fn.ts`, `server/lib/plugins/child/`.
- `proxy/lib/http/util/regex-rewriter.ts` rewrites obstructive `top`/`parent`
  code and strips SRI `integrity` for the AUT; `adapters/remove-security.ts` is
  the gate. HSTS is intentionally left intact — do not start stripping it.
- `@packages/https-proxy` intercepts AUT TLS, and verification is relaxed
  process-wide for proxied traffic. Requests to Cypress-owned services (Cloud,
  telemetry, update checks) must use `strictAgent` from `network/lib/agent.ts`,
  and the Node warning filter in `util/suppress_warnings.ts` must stay narrow.
- `socket/lib/utils.ts` raises a parser limit for the local driver↔server
  channel. Its comment states the assumption that makes this safe; preserve that
  assumption rather than the limit.

## Origin comparison

- Compare `URL.origin`, never a string prefix. `toFileServerUrl`
  (`network-tools/lib/remote-states.ts`) is the reference, and its comment says
  why: a prefix treats `http://localhost:2020@evil.com` as under the file origin.
  The same applies to matching a tab or frame by URL — use structured
  comparison, not `includes`.
- The `TypeError` fallbacks in `uri.ts` and `cors.ts` must keep returning a
  *recovered authority*, never raw input, or distinct malformed URLs collapse
  into one parsed object and compare same-origin. Never widen those `catch`es.
- `allowPrivateDomains` (`parse-domain.ts`) keeps tenants on a shared host in
  separate super-domains; callers must pass a hostname, not a URL.
- The third-party/first-party scoping for
  `experimentalModifyObstructiveThirdPartyCode` and `removeSRIAttributes` lives
  in both `remove-security.ts` and `inject-html.ts`. Change them together, or
  the stream and in-memory paths diverge.

## Inline script payloads

Route every value interpolated into an inline `<script>` through
`serializeForInlineScript` in `privileged-commands-manager.ts`, which escapes
`<`, `>`, U+2028 and U+2029. `JSON.stringify` alone is **not** enough: it does
not escape `<`, `>`, or `/`, so a value containing `</script>` closes the
element. This matters most where the value is not obviously constant — a cookie
value, a hostname derived from a proxied URL, a spec filename, a project name.
Prefer `Runtime.callFunctionOn` with `arguments` over composing a
`Runtime.evaluate` expression, and keep the builders in `automation/commands/`
numeric or boolean.

## Headers

- Header injection and smuggling are the live risk class in the proxy, because
  it deliberately runs a lenient parser and writes some headers past Node's
  validation. Keep `OmitProblematicHeaders` ordered before `SetInjectionLevel`.
- `x-cypress-*` headers carry trust decisions (`isAUTFrame` drives cookie
  attachment and injection level), so each must be deleted before passthrough.
- `x-cypress-internal-loopback-token` gates `proxiedUrl` override and force-proxy
  bypass: **every new passthrough path must strip it.** The comments in
  `adapters/internal-routes.ts` and `serve-internal-routes.ts` explain why header
  presence alone is never sufficient.

## Local endpoints and tokens

- `corsOriginDelegate.ts` is the pattern: require a loopback host **and** a
  matching port, across CORS, socket.io `allowRequest` and the `graphql-ws`
  upgrade. Any route or socket event that reaches a privileged handler — opening
  a file, launching a browser, setting the editor — needs an equivalent origin or
  token check.
- `socketId` is a rendezvous value, not authentication. Do not treat it as one.
- Compare secrets with `crypto.timingSafeEqual` on equal-length buffers, and
  generate them with `crypto.randomBytes`. Never log a token or an
  `access_token`.

## Reaching the OS

`shell.openExternal` (`gui/links.ts`) and the editor launch
(`util/file-opener.ts`, `actions/FileActions.ts`) are the paths from a socket
message to process execution. Allowlist the scheme, validate an editor against
the discovered `availableEditors`, and pass argv arrays rather than interpolated
strings — the Windows path runs through `cmd.exe /C`. `socket-base.ts` already
overrides the front-end-supplied `fileDetails.where` server-side; extend that
distrust, don't narrow it. Browser launch and `execa` need argv arrays whenever
an element derives from a project path, browser argument, spec name, or env var.

## Electron renderer privileges

`gui/windows.ts` sets `webSecurity: true`, `nodeIntegration: false` and
`contextIsolation: true` as defaults. Because `create()` merges caller options
with `_.defaultsDeep`, force these keys *after* the merge so a caller cannot opt
out, and derive `webSecurity` from `chromeWebSecurity` only for AUT windows.
Keep `setWindowOpenHandler` returning `deny`. A new `preload` needs
`contextIsolation` plus `sandbox` and a hand-written `contextBridge` allowlist.
The GUI window's origin must stay loopback.

## AUT content reaching privileged UI

`reifyDomElement` (`driver/src/util/serialization/log.ts`) assigns `innerHTML`
from a `postMessage`d payload that originated in the AUT, so widening that path
(more tags, event-handler attributes, `<script>`, `srcdoc`, `javascript:`) is
script execution in the runner's own origin. Keep the attribute allowlist, and
validate `event.origin` on anything the extension accepts from a page.

## Credentials

Record keys and auth tokens must pass through `hideKeys()` from
`@packages/config` before reaching a log, error, snapshot, or telemetry
attribute — `server/lib/modes/record.ts` is the example. It suits a high-entropy
key and nothing shorter. Snapshots under `packages/errors/test/__snapshots__`
are committed, so pass a picked subset into an error, never the whole config.
`HtmlDataSource.ts`'s `delete cfg.env` is the load-bearing scrub before config
reaches the browser, and Cloud request logging is deliberately body-free. Create
new secret files with mode `0o600`.

## Two last things

A PR that **deletes an existing security comment** in these files is a red flag:
they encode invariants not visible in the code.

Fixtures under `system-tests/projects/**` and `driver/cypress/fixtures/**`
contain intentionally unsafe HTML, and `packages/server/test/**` disables TLS
verification on purpose. Do not report those.
