# Security guidance for the Cypress monorepo

Cypress deliberately does things a normal web app typically does not do: it
terminates TLS for the app under test, strips its security headers, evaluates
user-authored code, and runs a privileged Electron process alongside the pages
it drives. "This disables a security control" is often correct here, so the
question a review has to answer is a narrower one.

**Ask of every change:** does it widen something Cypress does on purpose beyond
what that thing already reaches? And does it give anything new a path to the
user's machine, their credentials or their connection — the filesystem, the
local endpoints, stored secrets, the install path? The second carries the most
weight, because it is what a user cannot inspect or undo. `SECURITY.md` sets out
what users are responsible for; the rules here are what the code owes them in
return.

**Anchors.** Rules name a package and often a symbol. The rule is normative; the
names only help you find the code. If one stops resolving, grep for it, apply
the rule by behavior, and fix this file. Reasoning:
`guides/security-review-notes.md`.

## By design — do not report these

Flag only a change that widens their reach.

- Evaluating user code is the product: `@packages/driver` evaluates spec
  contents and the `cy.origin()` callback, and `@packages/server` runs the
  user's config and plugin code in a forked child process.
- `@packages/proxy` rewrites obstructive `top`/`parent` code and strips SRI
  `integrity` for the AUT. HSTS is intentionally left intact.
- `@packages/https-proxy` intercepts AUT TLS, and verification is relaxed
  process-wide for proxied traffic. Requests to Cypress-owned services must use
  `strictAgent` from `@packages/network`.
- `@packages/socket` raises a parser limit for the local driver↔server channel;
  preserve the assumption its comment rests on, not the number.
- Test fixtures reproduce patterns real applications use, so Cypress can be
  tested against them: framebusting and `window.top` checks, `<base target>` and
  cross-origin documents, login forms with placeholder credentials such as the
  driver's `auth_creds.ts`. The server's tests disable TLS verification.
  Placeholder passwords and unusual markup under `system-tests/` or a package's
  `cypress/fixtures/` are test data, not findings.

## Surfaces

- **Page content reaching privileged UI** — Don't widen what the driver
  evaluates. `reifyDomElement` puts page HTML into the runner's origin, so keep
  its attribute allowlist; validate `event.origin` on what the extension accepts
  from a page, and keep its host permissions narrow. `SECURITY.md` asks users to
  test only applications they control; these keep the cost of ignoring that
  advice off the user's machine, so keep them — and rank a finding here below
  one that reaches the host.
- **`proxy`, `network`, `https-proxy`, `network-tools`** — `x-cypress-*` headers
  drive injection level and cookie attachment, so delete them, and strip
  `x-cypress-internal-loopback-token`, on every passthrough path: both are
  process-local and must not leave the machine. Keep `OmitProblematicHeaders`
  before `SetInjectionLevel`.
- **Origin comparison** — Compare `URL.origin`, never a string prefix:
  `toFileServerUrl` is the reference, and its comment says why — a prefix treats
  `http://localhost:2020@evil.com` as under the file origin. Same for matching a
  tab or frame by URL. Parse-failure fallbacks must return a recovered
  authority, never raw input, or distinct malformed URLs compare same-origin.
  `allowPrivateDomains` keeps tenants on a shared host in separate
  super-domains; its callers pass a hostname, not a URL.
- **Cookies and `net-stubbing`** — Don't widen `hostOnly`; keep the
  `domainMatch` rejection; re-derive per redirect hop; new `res.cookie` calls go
  through the proxy's `setCookie` helper. Reflected `Origin` with
  `allow-credentials` stays gated to stubbed responses.
- **`server` routes + sockets** — Anything reaching a privileged handler needs an
  origin or token check, on the `corsOriginDelegate` pattern. `socketId` is
  rendezvous, not auth. Compare secrets with `timingSafeEqual`.
- **`server` → OS** — `openExternal` and the editor launch need an allowlisted
  scheme and an editor validated against `availableEditors`. Argv arrays, never
  interpolated strings — Windows goes through `cmd.exe /C`.
- **Config/plugins child process** — Nothing crossing back is evaluated,
  shelled, or path-joined unchecked. Keep loader flags out of
  `ORIGINAL_NODE_OPTIONS`. Runs on the *user's* Node — see `AGENTS.md` floors.
- **`electron`, `launcher`** — Force `contextIsolation`, `nodeIntegration` and
  `webSecurity` *after* any option merge so a caller can't opt out; derive
  `webSecurity` from `chromeWebSecurity` for AUT windows only.
  `setWindowOpenHandler` stays `deny`. A `preload` needs `sandbox` and a
  hand-written `contextBridge` allowlist.
- **Any generated JavaScript** — Route every value interpolated into an inline
  `<script>` through `serializeForInlineScript`, which escapes `<`, `>`, U+2028
  and U+2029. `JSON.stringify` alone is **not** enough: it leaves `/` intact, so
  a value containing `</script>` closes the element. Prefer
  `Runtime.callFunctionOn` with `arguments` over composing a `Runtime.evaluate`
  expression string.
- **`data-context`** — GraphQL mutations are privileged actions. The
  `delete cfg.env` scrub before config reaches the browser is load-bearing —
  re-check the served-config shape whenever it grows.
- **Cloud bundle loading in `server`** — Keep both halves of remote-bundle
  trust: signature against the embedded key, then the manifest's per-file hash
  allowlist. No local-path bypass reachable in a shipped build.
- **Anything that leaves the machine** (`config`, `errors`, `telemetry`, crash
  reporting) — Run values through `hideKeys()` before any log, error, snapshot
  or span. `captureError`-style reporters take a free-form `args` payload that
  rides along with the stack: send identifiers — a spec name, a `runnableId` —
  never config or `env`, request or response bodies, headers, cookies, page DOM,
  file contents, or a script's source. Pass a picked subset into an error, never
  the whole config; the error snapshots in `@packages/errors` are committed and
  public. Scrub at the call site: a server-side filter cannot un-send a payload.
  For any Sentry-style SDK added later, allowlist what gets attached and disable
  default body and breadcrumb capture.
- **`cli`** — Fail closed when a checksum is unavailable. `CYPRESS_*` vars
  resolve through `npm_config_*`/`npm_package_config_*`, so treat them as
  project-controlled: require `https:`, re-check the scheme on each redirect hop.
  Keep the extractor's traversal, symlink and size checks.
- **`npm/*` dev servers, preprocessors** — Dev servers stay bound to loopback and
  must not serve outside the project root. Preprocessor and plugin config is
  project-controlled input.
- **Build and release** (`tooling/`, `patches/`, `scripts/`) — The snapshot bakes
  module state into the shipped binary; a `patch-package` patch changes
  dependency behavior invisibly; release credentials stay out of logs and
  artifacts. The guide has the detail.
- **`.github/workflows`** — Never interpolate `github.event.*` text into `run:` —
  bind to `env:` and quote. Scrutinise `pull_request_target`, widened
  `permissions:`, and actions not pinned to a SHA.

## One meta-rule

A PR that **deletes an existing security comment** is a red flag: those comments
encode invariants the code alone does not show.
