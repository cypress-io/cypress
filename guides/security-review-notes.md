# Security Review Notes

Long-form companion to [`.claude/claude-security-guidance.md`](../.claude/claude-security-guidance.md),
which the [`security-guidance`](https://code.claude.com/docs/en/security-guidance)
plugin loads as review context. That file is capped at 8 KB, so it carries the
highest-leverage rules and points here for the rest.

This is a reviewer's map of the monorepo's trust boundaries and the invariants
that hold them together, written for humans and for agents asked to review a
change. It states what must remain true, not an assessment of what is true
today, and it does not replace `/security-review`, Snyk, or PR-time review.

## Trust boundaries

Cypress deliberately does things a normal web app must never do: it terminates
TLS for the app under test, strips its security headers, evaluates user-authored
code, and runs a privileged Electron process next to attacker-influenced page
content. "This disables a security control" is often correct here. The question
is always which side of a trust boundary it is on.

- **Untrusted**: the AUT — responses, DOM, cookies, `Set-Cookie`; anything over
  `postMessage` from an AUT frame; any `x-cypress-*` request header (same-origin
  AUT script can set these); a forged `Host` or `Referer`; a page script talking
  to the extension; GitHub issue and PR text.
- **Semi-trusted**: the user's project — `cypress.config.ts`, specs, plugin code,
  fixtures, and `package.json` `config`. They chose to run it; it must not
  escalate past Cypress itself.
- **Trusted**: the Electron main process, the server, the launchpad/app origin,
  release tooling and CI credentials.

Serious means untrusted data crossing into trusted, or a control protecting the
*user's own* connection or machine being weakened.

## By design — do not report these

Flag only a change that widens their reach.

- Running user code is the product: `driver/src/cypress/script_utils.ts`
  evaluates spec contents, `driver/src/cross-origin/origin_fn.ts` evaluates the
  `cy.origin()` callback, and `server/lib/plugins/child/` runs the user's config.
- `proxy/lib/http/util/regex-rewriter.ts` rewrites obstructive `top`/`parent`
  code and strips SRI `integrity` for the AUT; `adapters/remove-security.ts` is
  the gate; response headers are dropped in `response-middleware.ts`. HSTS is
  intentionally left intact — do not start stripping it.
- `@packages/https-proxy` intercepts AUT TLS with a generated CA, and
  verification is relaxed process-wide for proxied traffic. Requests to
  Cypress-owned services must use `strictAgent` from `network/lib/agent.ts`, and
  the Node warning filter in `util/suppress_warnings.ts` must stay narrow.
- `socket/lib/utils.ts` raises a socket.io-parser limit for the local
  driver↔server channel. Its comment states the assumption that makes this safe;
  preserve that assumption rather than the limit.

## Origin comparison

Compare `URL.origin`, never a string prefix. `toFileServerUrl`
(`network-tools/lib/remote-states.ts`) is the reference, and its comment says
why: a prefix treats `http://localhost:2020@evil.com` as being under the file
origin. Apply the same rule anywhere an origin, tab, or frame is matched by URL —
structured comparison, not `startsWith` or `includes`. Gates worth extra care
are the ones that mint credentials or set injection level, because a mismatch
there sends an `Authorization` header or relaxes security for the wrong origin.

The `TypeError` fallbacks in `uri.ts` and `cors.ts` must keep returning a
*recovered authority*, never the raw input: otherwise distinct malformed URLs
collapse into one parsed object and compare same-origin. Never widen those
`catch` blocks beyond `TypeError`. `allowPrivateDomains` in `parse-domain.ts`
keeps two tenants on a shared host (`*.herokuapp.com`) in separate
super-domains, and callers must pass a hostname, not a URL — the function
silently returns wrong results for a full URL.

The third-party/first-party scoping for
`experimentalModifyObstructiveThirdPartyCode` and `removeSRIAttributes` lives in
both `adapters/remove-security.ts` and `adapters/inject-html.ts`. Change them
together, or the stream and in-memory rewrite paths diverge. The `<base target>`
regex carries the same hazard, documented in its comment: it must re-emit the
boundary character, or the stream path skips the rewrite.

## Inline script payloads

Route every value interpolated into an inline `<script>` through
`serializeForInlineScript` in `privileged-commands/privileged-commands-manager.ts`,
which escapes `<`, `>`, U+2028 and U+2029. `JSON.stringify` alone is not enough:
it does not escape `<`, `>`, or `/`, so a value containing `</script>` closes the
element.

This matters most where a value is not obviously constant — a cookie value, a
hostname derived from a proxied URL, a spec filename, a project name, a
namespace. Prefer `Runtime.callFunctionOn` with `arguments` over composing a
`Runtime.evaluate` expression string, and keep the expression builders in
`automation/commands/` numeric or boolean. Values substituted into a JS file
that is written to disk and loaded as a browser extension should be JSON-encoded
at the substitution site.

## Headers and request smuggling

Header injection and smuggling are the live risk class in the proxy, because it
deliberately runs a lenient HTTP parser and writes some headers past Node's
validation. Treat any widening of either as high severity, and keep
`OmitProblematicHeaders` ordered before `SetInjectionLevel` — both touch CSP.

`x-cypress-*` headers carry trust decisions: `isAUTFrame` drives cookie
attachment and injection level, so each such header must be deleted before
passthrough. `x-cypress-internal-loopback-token` gates `proxiedUrl` override and
force-proxy bypass, so **every new passthrough path must strip it**. The guard
comments in `adapters/internal-routes.ts` and `adapters/serve-internal-routes.ts`
explain why the presence of a header alone must never be sufficient.

## Local endpoints and tokens

`corsOriginDelegate.ts` is the pattern to follow: require a loopback host **and**
a matching port, applied consistently across CORS, socket.io `allowRequest` and
the `graphql-ws` upgrade. Any route or socket event that reaches a privileged
handler — opening a file, launching a browser, setting the editor, project
actions — needs an equivalent origin or token check. `socketId` is a rendezvous
value, not authentication; do not treat it as one.

Compare secrets with `crypto.timingSafeEqual` on equal-length buffers, and
generate them with `crypto.randomBytes` rather than a string generator with a
reduced character set. Never log a token, an expected token, or an
`access_token`.

## Reaching the OS

`shell.openExternal` (`gui/links.ts`) and the editor launch
(`util/file-opener.ts`, `actions/FileActions.ts`) are the paths from a socket
message to process execution, and the Windows path runs through `cmd.exe /C`.
Allowlist the scheme, validate an editor against the discovered
`availableEditors`, and pass argv arrays rather than interpolated strings.
`socket-base.ts` already overrides the front-end-supplied `fileDetails.where`
server-side; extend that distrust, don't narrow it.

Browser launch and every `execa`/`child_process` call need argv arrays whenever
an element derives from a project path, browser argument, spec name, or
environment variable. Where a PID or other value is interpolated into a shell
command, assert it is an integer, or move the call to `execFile`. Sanitize a
page-supplied download filename with `path.basename` before joining it to a
directory — `util/escape_filename.ts` exists for this class of problem.

## Electron renderer privileges

`gui/windows.ts` sets `webSecurity: true`, `nodeIntegration: false` and
`contextIsolation: true` as defaults. Because `create()` merges caller options
with `_.defaultsDeep`, force these keys *after* the merge so a caller cannot opt
out, and derive `webSecurity` from `chromeWebSecurity` only for AUT windows.
Keep `setWindowOpenHandler` returning `deny`; never switch it to `allow` with
`overrideBrowserWindowOptions`.

A new `preload` script needs `contextIsolation` plus `sandbox` and a
hand-written `contextBridge` allowlist — never expose raw `require`, `process`,
`fs`, or `child_process`. The GUI window's origin must stay loopback: do not
`loadURL` a remote page into a window that shares the GUI's session or
partition.

## Remotely loaded and dynamically evaluated code

`cloud/require_script.ts` compiles remote scripts, and the trust chain has two
halves that must both stay in place: signature verification against the embedded
public key in `cloud/api/index.ts`, then a signed manifest that gates every file
by sha256 as a strict allowlist in `bundles/verify_bundle_on_disk.ts`. The
comment in that file states the model plainly; keep it accurate.

Anchor signature verification to the production key for a shipped binary, and
make an unrecognised environment fail loudly rather than resolve to `undefined`.
The `CYPRESS_LOCAL_*_PATH` escape hatches load a local script without
verification, so do not add another and do not let one become reachable outside
a dev build. Prefer `vm.runInNewContext` or JSON over `eval` for anything new
that reads project-supplied files in the privileged server process.

## The plugins IPC boundary

The child process runs the user's config and plugin code, so treat everything
crossing back as semi-trusted input: never `eval` it, never interpolate it into
a shell string or path, and confine any path it supplies to the project root
before watching or reading it. Validate config fields consumed as a path, an
executable, or a route *after* the IPC hop, not before.

Keep `fork`/`spawn` on argv arrays for this path. `NODE_OPTIONS` is assembled by
hand from `ORIGINAL_NODE_OPTIONS`, so treat that variable as untrusted and keep
loader flags out of it. A Node binary path taken from resolved app state should
be checked as an existing executable before use, and never sourced from project
config. Error payloads crossing back should stay allowlisted, the way
`plugins/util.ts` serializes them. This code runs on the *user's* Node, not the
bundled Electron — see the runtime floors in [`AGENTS.md`](../AGENTS.md).

## Cookies

Scope decisions live in `proxy/lib/http/util/cookies.ts`
(`shouldAttachAndSetCookies`, `calculateSiteContext`, `getSameSiteContext`) and
`server/lib/automation/cookie/`. Things to hold true:

- When there is no AUT URL, the fallbacks are deliberately permissive so the
  first AUT document's cookies survive a cross-origin redirect. Do not widen
  them further, and do not make attachment unconditional.
- `hostOnly` must not widen to all subdomains through an automation round-trip —
  coercing `undefined` to `false` changes cookie scope. `isHostOnlyCookie`
  depends on `parseDomain` returning non-null, so changes to its null cases
  change scope silently.
- Keep the `tough.domainMatch` rejection in `server/lib/request.ts`, which stops
  a response setting a cookie for an arbitrary domain.
- Cookies are re-derived per redirect hop. A new redirect handler must keep both
  halves, or origin A's cookies get sent to origin B.
- New `res.cookie` calls in the proxy should go through the `setCookie` helper,
  which omits `Domain` for IPv6 literals because the serializer rejects `[::1]`.
- `resourceTypeAndCredentialManager` is a process-global FIFO keyed on a hash of
  the URL, and the credential level it returns drives cookie attachment. Treat
  desynchronisation as a real risk and make sure it is cleared on spec
  boundaries.

## Reflected CORS

`net-stubbing` reflects the request `Origin` and sets
`access-control-allow-credentials: true` for stubbed responses. That is
acceptable only while it stays gated to matched routes and preflights. Applying
those default headers to pass-through responses would make the proxy an open
credentialed-CORS reflector.

## Certificates

In `https-proxy/lib/ca.ts`, `CA_VERSION` is what clears a user's cached CA, so
changing cert format, key size, signature algorithm, or extensions requires
bumping it — otherwise stale certificates are reused from disk indefinitely.
Treat the CA private key's on-disk location and permissions as sensitive. The
hostname-to-filename mapping feeds `path.join`, so any change to how a hostname
is derived from a request is a path-traversal review item. Leaf certificates
should carry the narrowest usable `extKeyUsage` — narrow, never widen. Keep the
interception server bound to loopback.

## AUT content reaching privileged UI

`reifyDomElement` in `driver/src/util/serialization/log.ts` assigns `innerHTML`
from a `postMessage`d payload that originated in the AUT and reifies its
attributes. Widening that path — more tag names, event-handler attributes,
`<script>`, `<iframe>`, `srcdoc`, `javascript:` URLs — is script execution in
the runner's own origin, not the AUT's. The attribute allowlist is the control.

Anything the browser extension accepts from a page should validate
`event.origin` against the Cypress server origin; a `source === window` check
alone is satisfied by any script running in that page. The extension's host
permissions and content-script matches should stay as narrow as the feature
allows.

## Credentials

Record keys and auth tokens must pass through `hideKeys()` from
`@packages/config` before reaching a log, error template, snapshot, or telemetry
attribute — `server/lib/modes/record.ts` is the example to follow. It suits a
high-entropy key and nothing shorter or lower-entropy.

Snapshots under `packages/errors/test/__snapshots__` are committed to a public
repository, so pass a picked subset into an error, never the whole config
object. `HtmlDataSource.ts`'s `delete cfg.env` is the load-bearing scrub before
config reaches the browser: anything added to the served-config shape needs
checking for secrets. Cloud request logging is deliberately body-free — adding
the request body would put the record key in logs. Create new files that hold
secrets with mode `0o600`.

## Install path

The downloaded binary's integrity check should fail closed: when a checksum is
unavailable, that is a reason to stop, not to proceed. A checksum carried
alongside the download detects corruption, not a hostile mirror, so prefer a
signature anchored to a key shipped with the CLI.

`CYPRESS_DOWNLOAD_MIRROR`, `CYPRESS_DOWNLOAD_PATH_TEMPLATE`,
`CYPRESS_INSTALL_BINARY` and `CYPRESS_RUN_BINARY` are all read through
`util.getEnv`, which also honours `npm_config_*` and `npm_package_config_*` — so
a project's own `package.json` can set them. Treat them as project-controlled:
require `https:`, validate the host, and re-check the scheme on each manual
redirect hop. `CYPRESS_RUN_BINARY` must stay a `spawn` file argument, never part
of a shell string.

`extract-with-yauzl.ts` holds the invariants for archive extraction — entry path
traversal check, symlink target confined to the destination, symlink size cap,
mode preservation. Keep them, and prefer that path over delegating to a system
`unzip`/`ditto`, which enforces none of them.

## Workflows

`.github/workflows/` holds real credentials, and workflows that trigger on
`issue_comment` or `pull_request_target` receive attacker-controlled text. Never
interpolate `github.event.*` text into a `run:` block — bind it to an `env:` var
and quote the expansion. Scrutinise any move to `pull_request_target`, any
widening of `permissions:`, and any third-party action not pinned to a commit
SHA.

## Two last things

A PR that **deletes an existing security comment** in these files is a red flag:
those comments encode invariants that are not visible in the code itself.

Fixtures under `system-tests/projects/**` and
`packages/driver/cypress/fixtures/**` contain intentionally unsafe HTML and
insecure requests, and `packages/server/test/**` disables TLS verification on
purpose. Do not report those as vulnerabilities.
