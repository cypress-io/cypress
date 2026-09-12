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

## Deliberate exceptions — do not "fix" these

Flag only a change that widens their reach.

- Running user code is the product: `driver/src/cypress/script_utils.ts`,
  `driver/src/cross-origin/origin_fn.ts`, `server/lib/plugins/child/`.
- `proxy/lib/http/util/regex-rewriter.ts` rewrites obstructive `top`/`parent`
  code and strips SRI `integrity`; `adapters/remove-security.ts` is only the
  gate. HSTS is deliberately never stripped — do not add it.
- `@packages/https-proxy` intercepts AUT TLS. `server/lib/request.ts` sets
  `NODE_TLS_REJECT_UNAUTHORIZED=0` process-wide and `util/suppress_warnings.ts`
  hides the warning — do not widen that filter. Calls to Cypress-owned services
  must use `strictAgent` from `network/lib/agent.ts`.
- `socket/lib/utils.ts` lifts socket.io-parser's `maxAttachments` DoS cap,
  justified as "two trusted local processes" — widening who can reach that socket
  invalidates that and must be raised.

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
- `allowPrivateDomains` (`parse-domain.ts`) keeps tenants on a shared host in
  separate super-domains; callers must pass a hostname, not a URL.
- The third-party/first-party scoping for
  `experimentalModifyObstructiveThirdPartyCode` and `removeSRIAttributes` is
  duplicated in `remove-security.ts` **and** `inject-html.ts`.

## Inline script payloads

`privileged-commands-manager.ts` has the correct escaper,
`serializeForInlineScript` (`<`, `>`, U+2028, U+2029). Use it for every value
interpolated into an inline `<script>`. `JSON.stringify` alone is **not** enough:
it does not escape `<`, `>`, or `/`, so a value containing `</script>` closes the
element. Sites to hold to this standard: `proxy/lib/http/util/inject.ts` (its
payload carries `simulatedCookies` from the origin's own `Set-Cookie`, and
`document.domain` from `getSuperDomain`) and
`data-context/src/sources/HtmlDataSource.ts` (spec filenames, `projectName`,
`namespace`). `socket/lib/node/cdp-socket.ts` hand-rolls quote escaping into a
`Runtime.evaluate` expression — prefer `callFunctionOn` with `arguments`, and
keep the builders in `automation/commands/` numeric or boolean.

## Headers

- `PatchExpressSetHeader` bypasses Node's `ERR_INVALID_CHAR`, and
  `insecureHTTPParser: true` is set in `network/lib/http-utils.ts`, so header
  injection and smuggling are the live risk class in the proxy. Keep
  `OmitProblematicHeaders` before `SetInjectionLevel`.
- `x-cypress-*` headers carry trust decisions (`isAUTFrame` drives cookie
  attachment and injection level), so each must be deleted before passthrough.
- `x-cypress-internal-loopback-token` gates `proxiedUrl` override and force-proxy
  bypass: **every new passthrough path must strip it.** The comments in
  `adapters/internal-routes.ts` and `serve-internal-routes.ts` explain why header
  presence alone is never sufficient.

## Local endpoints and tokens

- `/__launchpad/*` is protected by `corsOriginDelegate.ts` (loopback host **and**
  matching port) across CORS, socket.io `allowRequest` and the `graphql-ws`
  upgrade. `/__cypress/graphql` and the driver socket.io server have no
  equivalent check and both reach privileged handlers, so new routes or socket
  events there need an origin or token check.
- Do not treat `socketId` as authentication — no handler requires it.
- Token comparisons in `file_server.ts`, `internal-routes.ts`,
  `privileged-commands-manager.ts` and `cloud/auth.ts` use `!==`; new ones should
  use `crypto.timingSafeEqual`, with tokens from `crypto.randomBytes` rather than
  `util/random.ts`'s reduced charset. Never log a token or an `access_token`.

## Reaching the OS

`shell.openExternal` (`gui/links.ts`) and the editor launch
(`util/file-opener.ts`, `actions/FileActions.ts`, which pass `"${binary}"` as a
quoted string and hit `cmd.exe /C` on Windows) are the two paths from a socket
message to process execution. Validate the scheme, validate the editor against
the discovered `availableEditors`, prefer argv arrays. `socket-base.ts` already
overrides the front-end-supplied `fileDetails.where` server-side for this reason
— extend that distrust, don't narrow it. Browser launch and `execa` need argv
arrays whenever an element derives from a project path, browser argument, spec
name, or env var.

## Electron renderer privileges

`gui/windows.ts` defaults to `webSecurity: true`, `nodeIntegration: false`,
`contextIsolation: true`, but `create()` merges with `_.defaultsDeep` and then
unconditionally overwrites `webSecurity` from `chromeWebSecurity`. Force these
keys *after* the merge so a caller cannot opt out, and derive `webSecurity` from
config only for AUT windows. Keep `setWindowOpenHandler` returning `deny`. A new
`preload` needs `contextIsolation` plus `sandbox` and a hand-written
`contextBridge` allowlist. The GUI window's origin must stay loopback.

## AUT content reaching privileged UI

`reifyDomElement` (`driver/src/util/serialization/log.ts`) assigns `innerHTML`
from a `postMessage`d payload that originated in the AUT, so widening that path
(more tags, event-handler attributes, `<script>`, `srcdoc`, `javascript:`) is
script execution in the runner's own origin.

## Credentials

Record keys and auth tokens must pass through `hideKeys()` from
`@packages/config` before reaching a log, error, snapshot, or telemetry attribute
— `server/lib/modes/record.ts` does this. It reveals 10 characters, so it suits a
high-entropy key and nothing shorter. Snapshots under
`packages/errors/test/__snapshots__` are committed, so pass a picked subset into
an error, never the whole config. `HtmlDataSource.ts`'s `delete cfg.env` is the
load-bearing scrub before config reaches the browser, and Cloud request logging
is deliberately body-free.

## Two last things

A PR that **deletes an existing security comment** in these files is a red flag:
they encode invariants not visible in the code.

Fixtures under `system-tests/projects/**` and `driver/cypress/fixtures/**`
contain intentionally unsafe HTML, and `packages/server/test/**` disables TLS
verification on purpose. Do not report those.
