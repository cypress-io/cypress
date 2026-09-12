# Security guidance for the Cypress monorepo

Cypress deliberately does things a normal web app must never do: it terminates
TLS for the app under test, strips its security headers, evaluates user-authored
code, and runs a privileged Electron process next to attacker-influenced page
content. "This disables a security control" is often correct here. The only
question is **which side of a trust boundary it is on**.

- **Untrusted** — the AUT: its responses, DOM, cookies and `Set-Cookie`; anything
  over `postMessage` from an AUT frame; any `x-cypress-*` request header; a
  forged `Host` or `Referer`; a page script messaging the extension; GitHub
  issue and PR text.
- **Semi-trusted** — the user's project: config, specs, plugin code, fixtures and
  `package.json` `config`. They chose to run it; it must not escalate past
  Cypress itself.
- **Trusted** — the Electron main process, the server, the launchpad/app origin,
  release tooling and CI credentials.

Serious means untrusted data crossing into trusted, or a control protecting the
*user's own* connection or machine being weakened. Long form, with the reasoning
behind each rule: `guides/security-review-notes.md`.

## By design — do not report these

Flag only a change that widens their reach.

- Evaluating user code is the product: `driver/src/cypress/script_utils.ts`,
  `driver/src/cross-origin/origin_fn.ts`, `server/lib/plugins/child/`.
- `proxy/lib/http/util/regex-rewriter.ts` rewrites obstructive `top`/`parent`
  code and strips SRI `integrity` for the AUT. HSTS is intentionally left intact.
- `@packages/https-proxy` intercepts AUT TLS, and verification is relaxed
  process-wide for proxied traffic. Requests to Cypress-owned services must use
  `strictAgent` (`network/lib/agent.ts`).
- `socket/lib/utils.ts` raises a parser limit for the local driver↔server
  channel; preserve the assumption its comment rests on, not the number.
- Intentionally unsafe fixtures live in `system-tests/projects/**` and
  `packages/driver/cypress/fixtures/**`, and `packages/server/test/**` disables
  TLS verification on purpose.

## Surfaces

- **`driver`** — Don't widen what gets evaluated. `reifyDomElement`
  (`util/serialization/log.ts`) puts AUT-origin HTML into the runner's origin —
  keep its attribute allowlist.
- **`proxy`, `network`, `https-proxy`, `network-tools`** — Compare `URL.origin`.
  Delete `x-cypress-*` and strip `x-cypress-internal-loopback-token` on every
  passthrough path. Keep `OmitProblematicHeaders` before `SetInjectionLevel`.
- **`net-stubbing`** — Reflected `Origin` with `allow-credentials` stays gated to
  matched/stubbed responses.
- **Cookies** (`proxy/.../cookies.ts`, `server/lib/automation/cookie/`) — Don't
  widen `hostOnly`; keep the `domainMatch` rejection; re-derive per redirect hop;
  new `res.cookie` goes through the `setCookie` helper.
- **`server` routes + sockets** — Anything reaching a privileged handler needs an
  origin or token check, on the `corsOriginDelegate.ts` pattern. `socketId` is
  rendezvous, not auth. Compare secrets with `timingSafeEqual`.
- **`server` → OS** — `openExternal` and the editor launch need an allowlisted
  scheme and an editor validated against `availableEditors`. Argv arrays, never
  interpolated strings — Windows goes through `cmd.exe /C`.
- **`plugins`/config child** — Nothing crossing back is evaluated, shelled, or
  path-joined unchecked. Keep loader flags out of `ORIGINAL_NODE_OPTIONS`. Runs
  on the *user's* Node — see `AGENTS.md` floors.
- **`electron`, `launcher`** — Force `contextIsolation`, `nodeIntegration` and
  `webSecurity` *after* the option merge so a caller can't opt out; derive
  `webSecurity` from `chromeWebSecurity` for AUT windows only.
  `setWindowOpenHandler` stays `deny`. A `preload` needs `sandbox` plus a
  hand-written `contextBridge` allowlist.
- **`extension`** — Validate `event.origin` on anything accepted from a page;
  keep host permissions and content-script matches as narrow as the feature
  allows.
- **`app`, `launchpad`, `frontend-shared`, `reporter`** — Spec names, project
  names and AUT text are untrusted in the DOM. Every inline-script value goes
  through `serializeForInlineScript`.
- **`data-context`** — GraphQL mutations are privileged actions.
  `HtmlDataSource`'s `delete cfg.env` is load-bearing — re-check the
  served-config shape whenever it grows.
- **`server/lib/cloud`** — Keep both halves of remote-bundle trust: signature
  against the embedded key, then the manifest's per-file hash allowlist. No new
  local-path bypass reachable in a shipped build.
- **`config`, `errors`** — `hideKeys()` before any log, error or snapshot.
  Snapshots under `packages/errors/test/__snapshots__` are committed and public —
  pass a picked subset into an error, never the whole config.
- **`telemetry`** — No config, env, credentials or credential-bearing URLs in
  span attributes.
- **`cli`** — Fail closed when a checksum is unavailable. `CYPRESS_*` vars
  resolve through `npm_config_*`/`npm_package_config_*`, so treat them as
  project-controlled: require `https:`, re-check the scheme on each redirect hop.
  Keep the hardened extractor's traversal, symlink and size checks.
- **`npm/*` dev servers, preprocessors** — Dev servers stay bound to loopback and
  must not serve outside the project root. Preprocessor and plugin config is
  project-controlled input.
- **`tooling/v8-snapshot`, `packherd`** — The snapshot bakes module state into
  the shipped binary — nothing secret or machine-specific may be captured.
- **`patches/`** — A `patch-package` patch changes dependency behavior
  invisibly. Review one like vendored code.
- **`scripts/`** — Release credentials. Never echo them, and keep them out of
  logs and published artifacts.
- **`.github/workflows`** — Never interpolate `github.event.*` text into `run:` —
  bind to `env:` and quote. Scrutinise `pull_request_target`, widened
  `permissions:`, and actions not pinned to a SHA.

## Origin comparison

Compare `URL.origin`, never a string prefix — `toFileServerUrl`
(`network-tools/lib/remote-states.ts`) is the reference, and its comment says
why: a prefix treats `http://localhost:2020@evil.com` as under the file origin.
The same goes for matching a tab or frame by URL: structured comparison, not
`includes`. Gates that mint credentials or set injection level deserve the most
care. The `TypeError` fallbacks in `uri.ts` and `cors.ts` must keep returning a
recovered authority, never raw input, or distinct malformed URLs collapse into
one parsed object and compare same-origin. `allowPrivateDomains`
(`parse-domain.ts`) keeps tenants on a shared host in separate super-domains,
and its callers must pass a hostname, not a URL.

## Inline script payloads

Route every value interpolated into an inline `<script>` through
`serializeForInlineScript` (`privileged-commands-manager.ts`), which escapes
`<`, `>`, U+2028 and U+2029. `JSON.stringify` alone is **not** enough: it does
not escape `<`, `>`, or `/`, so a value containing `</script>` closes the
element. Prefer `Runtime.callFunctionOn` with `arguments` over composing a
`Runtime.evaluate` expression, and keep the builders in `automation/commands/`
numeric or boolean.

## One meta-rule

A PR that **deletes an existing security comment** is a red flag: those comments
encode invariants the code alone does not show.
