# Security guidance for the Cypress monorepo

Cypress is a test runner. It deliberately does things a normal web app must never
do: it terminates TLS for the application under test, strips the AUT's security
headers, evaluates user-authored code, and runs a privileged Electron process
next to attacker-influenced page content. So "this code disables a security
control" is often correct here. The question is always **which side of a trust
boundary it happens on**.

Treat these as the trust boundaries:

- **Untrusted**: the application under test, its responses, its DOM, its cookies;
  anything arriving over `postMessage` from an AUT frame; GitHub issue and PR text.
- **Semi-trusted**: the user's project — `cypress.config.ts`, spec files, plugin
  code, fixture paths. The user chose to run it, but it must not escalate beyond
  the privileges Cypress already has.
- **Trusted**: the Electron main process, the server, the launchpad/app UI origin,
  release tooling and CI credentials.

A finding is serious when untrusted data crosses into trusted, or when a control
that protects the *user's own* connection is weakened.

## Deliberate, load-bearing exceptions

Do not "fix" these. Flag only a change that widens what they accept.

- `packages/driver/src/cypress/script_utils.ts` evaluates spec contents via
  `specWindow.eval`. Running the user's spec is the product.
- `packages/driver/src/cross-origin/origin_fn.ts` evaluates the serialized
  `cy.origin()` callback with `window.eval`. Also by design.
- `packages/proxy/lib/adapters/remove-security.ts` strips AUT response security
  headers so the AUT can be framed and instrumented.
- `@packages/https-proxy` intercepts the AUT's TLS with generated certificates.
- `packages/server/lib/browsers/chrome.ts` passes `--disable-web-security` when
  the user sets `chromeWebSecurity: false`, and
  `packages/server/lib/gui/windows.ts` derives the Electron window's
  `webSecurity` from that same config.

For each of these, the review question is narrow: does the change let the
mechanism reach traffic, an origin, or a process it did not reach before?

## What to look for

**Origin and scope decisions.** Cookie, interception, and proxy logic must
compare parsed URL components, not string prefixes. A `startsWith`/`includes`
check on an origin treats `example.com.attacker.net` as `example.com`, which
sends a cookie or a matched intercept to the wrong host. The same applies to
cookie `Domain`, `Secure`, and `SameSite` derivation.

**Security-header rewriting.** Anything in `packages/proxy` or
`packages/network` that removes or relaxes CSP, `X-Frame-Options`, HSTS, or the
cross-origin isolation headers must apply to AUT responses only — never to the
Cypress UI's own origin, and never to a third-party request the AUT happens to
make.

**AUT content reaching privileged UI.** `reifyDomElement` in
`packages/driver/src/util/serialization/log.ts` assigns `innerHTML` from a
`postMessage`d payload that originated in the AUT, and reifies its attributes.
Anything that widens that path — more tag names, more attributes, event handler
attributes, `<script>`, `<iframe>`, `srcdoc`, `javascript:` URLs — is script
execution in the runner's own origin, not the AUT's. Attribute allowlisting is
the control; keep it.

**Electron renderer privileges.** Any new `BrowserWindow` or `webPreferences`
change: keep `contextIsolation` on and `nodeIntegration` off for any window that
can load remote or AUT-influenced content. Expose capability through an explicit
preload bridge with a narrow surface, never the raw `require`, `fs`, or
`child_process`.

**The config/plugins child process.** It executes the user's config and plugin
code, so treat everything crossing back over that IPC channel as semi-trusted
input: never `eval` it, never interpolate it into a shell string, and resolve any
path it supplies against the project root before touching the filesystem. This
code also runs on the *user's* Node — see the runtime floors in `AGENTS.md`
before using a modern API.

**Process spawning.** Browser launch, `execa`, and `child_process` calls must
pass an argv array, not a composed shell string, whenever any element comes from
a project path, browser argument, spec name, or environment variable.

**Local HTTP and socket endpoints.** The server, GraphQL endpoint, and
`__cypress`/`__launchpad` routes are reachable from the AUT's browser. New routes
need an origin or token check, and any token comparison should be constant-time.
Adding a permissive CORS header to these is a finding.

**Credentials.** Record keys and auth tokens must pass through `hideKeys()` from
`@packages/config` before reaching a log, an error template, a snapshot, or a
telemetry attribute — `packages/server/lib/modes/record.ts` does this before
building `CLOUD_RECORD_KEY_NOT_VALID`. Error snapshots under
`packages/errors/test/__snapshots__` are committed, so a key that reaches an
error message reaches the public repo.

**Archive extraction and downloads.** In `cli/`, validate entry paths before
extracting (no absolute paths, no `..`), and keep checksum verification on the
downloaded binary. `CYPRESS_DOWNLOAD_*` and `CYPRESS_RUN_BINARY` are
user-controlled: they must not build a shell command, and paths derived from them
should be resolved and checked.

**Workflows.** Files under `.github/workflows/` hold real credentials —
`WORKFLOW_DEPLOY_KEY`, `CYPRESS_BOT_APP_PRIVATE_KEY`, npm and AWS tokens in
`scripts/`. `triage_handle_new_comments.yml` triggers on `issue_comment`, so
comment text is attacker-controlled. Never interpolate `github.event.*` text into
a `run:` block; bind it to an `env:` var and quote the expansion. Scrutinize any
move to `pull_request_target`, any widening of `permissions:`, and any new
third-party action that is not pinned to a commit SHA.

## Out of scope

Test fixtures under `system-tests/projects/**` and
`packages/driver/cypress/fixtures/**` contain intentionally unsafe HTML and
insecure requests, and `packages/server/test/**` disables TLS verification on
purpose. Do not report those as vulnerabilities.
