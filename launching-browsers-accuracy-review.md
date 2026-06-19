# Accuracy Review: "Launching Browsers" docs page

Reviewed page: <https://docs.cypress.io/app/references/launching-browsers>

This review cross-checks the published documentation against the current
Cypress source code (`cypress-io/cypress`). Every claim below is annotated
with the file(s) that implement it so the docs team can verify and update the
page. Code references use `package/path:line` form.

> Note: The docs themselves live in the separate `cypress-documentation`
> repository, which is outside this session's scope. This file captures the
> findings and proposed replacement/expansion copy so the change can be ported
> there.

---

## 1. Verdict

The page is **largely accurate** but **out of date in a few important places**
and **missing several behaviors that users hit in practice**. The highest-value
fixes:

1. **Chrome 137+ can no longer load extensions** via `--load-extension`. This
   contradicts the page's "Browser Launch API … load extensions" guidance and
   is not mentioned anywhere.
2. **Firefox's real minimum supported version is 135** (WebDriver BiDi), which
   is enforced in code with a hard warning. The page only mentions geckodriver
   and an incidental "Firefox 139+" Docker detail.
3. The **browser-isolation / flags** section is a hand-curated summary that has
   drifted from the actual flag list; several modern entries are missing
   (Local Network Access, Translate, Privacy Sandbox, fake media devices, etc.).
4. Several **escape hatches and error behaviors** are undocumented
   (`IGNORE_CHROME_PREFERENCES`, the 50-second CDP connection timeout, the
   `chrome://policy` / `edge://policy` hint).

---

## 2. Claim-by-claim accuracy check

### Supported browsers — ✅ accurate

The list (Chrome stable/beta/canary, Chrome for Testing, Chromium, Edge
stable/beta/canary/dev, Electron, Firefox stable/dev/nightly, WebKit) matches
the canonical registry.

- Source of truth: `packages/launcher/lib/known-browsers.ts:23-143`.
- The canonical `--browser <name>` values are
  `electron`, `chrome`, `chromium`, `chrome-for-testing`, `edge`, `firefox`
  (`packages/errors/src/errors.ts:123`, `BROWSER_NOT_FOUND_BY_NAME`).

### `--browser` invocation forms — ✅ accurate, could be expanded

`cypress run --browser <name|name:channel|path>` is correct. The page shows
`chrome:beta`, `chrome:canary`, `firefox:dev`, and a raw path. Worth stating
explicitly that the three accepted forms are: short name, `name:channel`, and
an absolute path to a binary (`packages/launcher/lib/detect.ts`,
`BROWSER_NOT_FOUND_BY_PATH` at `packages/errors/src/errors.ts:130`).

### Electron is bundled / headless by default — ✅ accurate

`cypress run` defaults to Electron headless; `--headed` runs it headed. Note
the Electron-specific `--gtk-version=3` flag Cypress injects
(`packages/server/lib/util/chromium_flags.ts:155-161`).

### Chrome "evergreen" + `RemoteDebuggingAllowed` — ✅ accurate, expand

Confirmed. When CDP can't connect, the error explicitly calls out the
`RemoteDebuggingAllowed` enterprise/group policy and points users at
`chrome://policy` / `edge://policy`
(`packages/errors/src/errors.ts:1182-1211`, `CDP_COULD_NOT_CONNECT`).
Two precise details the page should add:
- The connection is retried for **50 seconds** before failing.
- The policy hint applies only to standalone Chrome/Edge, **not** Electron.

### Firefox requires geckodriver — ✅ but incomplete (see §3.2)

`packages/server/lib/browsers/firefox.ts:23-24` imports `geckodriver` and the
`webdriver` packages; Cypress drives Firefox over **WebDriver BiDi**.

### WebKit (experimental) — ✅ mostly accurate (see §3.3)

`experimentalWebKitSupport: true` is required and enforced at runtime
(`packages/server/lib/browsers/webkit.ts:74-77`). `playwright-webkit` is
resolved from the user's project path (`webkit.ts:80`).

### Customizing available browsers (`config.browsers`) — ✅ accurate

The `setupNodeEvents` filtering example and the browser object shape
(`name`, `family`, `channel`, `displayName`, `version`, `majorVersion`,
`path`) match `packages/launcher/lib/known-browsers.ts` and the `FoundBrowser`
type in `@packages/types`.

### "Darker theme" visual distinction — ✅ accurate

Cypress loads a theme extension into the launched profile
(`extension.getPathToTheme()`, `packages/server/lib/browsers/chrome.ts:48`).

---

## 3. Inaccurate / outdated items to fix

### 3.1 Chrome 137+ does not support loading extensions (MISSING — high priority)

The page's "Browser Launch API … load extensions" framing is now wrong for
modern Chrome. As of **Chrome 137**, `--load-extension` is rejected by Chrome,
and Cypress emits a warning:

> Google Chrome v137 and higher does not allow loading extensions via
> `--load-extension`. If you need to load an extension to test with Cypress,
> please use Chrome for Testing, Chromium, or another Chrome variant that
> supports loading extensions.

- Code: `packages/errors/src/errors.ts:106-109`
  (`CHROME_137_LOAD_EXTENSION_NOT_SUPPORTED`) and the guard at
  `packages/server/lib/browsers/chrome.ts:186-191`.
- **Proposed copy:** add a callout under the extension-loading section noting
  that extension loading requires **Chrome for Testing, Chromium, or another
  Chrome variant** on Chrome 137+, since stable Chrome no longer supports it.

### 3.2 Firefox minimum version is 135 (clarify)

The page mentions geckodriver and, in passing, a Docker image with "Firefox
139+". The **enforced** minimum is **135**: Cypress refuses older Firefox with:

> Cypress does not support running `<Firefox>` version `<n>` due to lack of
> WebDriver BiDi support. To use `<Firefox>` with Cypress, install version 135
> or newer.

- Code: `packages/launcher/lib/known-browsers.ts:3-20`
  (`firefoxValidatorFn`, applied to all three Firefox channels).
- **Proposed copy:** state plainly that **Firefox 135+ is required** (WebDriver
  BiDi). The "139+" figure is just what a specific Docker image ships; it is not
  the support floor.

### 3.3 WebKit limitations list is incomplete

The page lists `cy.origin()`, `cy.intercept()` forceNetworkError, and missing
event `data`. Source code shows additional hard-unsupported paths worth listing:
- **Cypress-in-Cypress is not supported** for WebKit
  (`packages/server/lib/browsers/webkit.ts:39-41`).
- **Cypress Protocol / Test Replay is not supported** in WebKit
  (`webkit.ts:43-45`, `:55-57`).
- WebKit requires installing `playwright-webkit` in the project and, on Linux,
  the Playwright system deps — already on the page; keep it.

### 3.4 Browser-isolation flag list has drifted (expand & re-verify)

The page's "Cypress automatically disables …" bullets are a paraphrase of the
real flag set and are missing several current entries. The authoritative list
is `packages/server/lib/util/chromium_flags.ts:1-138`. Notable items not
reflected on the page:
- **Local Network Access checks disabled** (Chrome 141+) so automated
  cross-origin requests to local dev servers aren't gated behind a permission
  prompt (`chromium_flags.ts:29-39`).
- **Translate** popup disabled (`chromium_flags.ts:41-43`).
- **Privacy Sandbox** "Enhanced ad privacy" dialog disabled
  (`PrivacySandboxSettings4`, `chromium_flags.ts:25-27`).
- **Media Router / cast discovery** disabled to cut background networking
  (`chromium_flags.ts:16-19`).
- **Fake media devices**: `use-fake-ui-for-media-stream` and
  `use-fake-device-for-media-stream` for webcam/WebRTC testing
  (`chromium_flags.ts:111-114`).
- **`autoplay-policy=no-user-gesture-required`** (the page's "user gesture for
  autoplay" bullet — confirmed at `chromium_flags.ts:82`).
- **`disable-dev-shm-usage`** (writes shared memory to `/tmp`; relevant to
  Docker/CI users) (`chromium_flags.ts:128-131`).
- Chrome **preferences** Cypress writes (not flags): autofill profile + credit
  card prompts off, promo/welcome content off, command-line flag security
  warnings off (`packages/server/lib/browsers/chrome.ts:52-73`).

---

## 4. Missing sections worth adding

### 4.1 `IGNORE_CHROME_PREFERENCES` escape hatch (undocumented)

When the app under test encrypts the user-data dir (breaking relaunches),
setting `IGNORE_CHROME_PREFERENCES` makes Cypress skip reading/writing Chrome
preference files.
- Code: `packages/server/lib/browsers/chrome.ts:83-87`, `:143-147`
  (see cypress-io/cypress#29330).

### 4.2 Headless "new" mode

Chrome's `--headless=new` path is used from **Chrome 112+**
(`CHROME_VERSION_INTRODUCING_HEADLESS_NEW`,
`packages/server/lib/browsers/chrome.ts:33`). A note on headless-vs-headed
rendering differences and the version cutover would help users debugging
headless-only failures.

### 4.3 Automatic download handling

Both Chrome and Firefox are configured to auto-accept downloads to the
configured `downloadsFolder` rather than showing a prompt
(Chrome: `chrome.ts:270-307`; Firefox builds an allow-list of essentially all
known MIME types, `firefox.ts:35-41`). This is user-visible behavior worth a
short subsection.

### 4.4 Connection-timeout troubleshooting

Tie the `RemoteDebuggingAllowed` policy guidance to a concrete symptom: a
50-second CDP connection timeout, and the `chrome://policy` / `edge://policy`
verification step (`packages/errors/src/errors.ts:1182-1200`).

---

## 5. Suggested page structure (after edits)

1. Overview
2. Supported browsers (+ canonical `--browser` names and the three invocation
   forms)
3. Browser version support (state Firefox **135+** explicitly)
4. Electron (bundled, headless default, `--headed`)
5. Chrome / Chromium / Edge (evergreen, Chrome for Testing, **extension
   loading caveat for Chrome 137+**)
6. Firefox (geckodriver/WebDriver BiDi, 135+ floor, air-gapped/custom driver)
7. WebKit (experimental) — full unsupported-feature list
8. How Cypress modifies the browser environment (flags + preferences, link to
   source, mention `IGNORE_CHROME_PREFERENCES`)
9. Customizing available browsers (`config.browsers`, adding Brave/custom)
10. Browser Launch API (`before:browser:launch`) — flags, extensions caveat
11. Troubleshooting (CDP 50s timeout, `RemoteDebuggingAllowed`, headless diffs)

---

## 6. Code references index

| Topic | File |
| --- | --- |
| Known browser registry / Firefox 135 validator | `packages/launcher/lib/known-browsers.ts` |
| Browser detection per-OS | `packages/launcher/lib/detect.ts`, `lib/{darwin,linux,windows}/` |
| Chrome launch, prefs, downloads, extensions | `packages/server/lib/browsers/chrome.ts` |
| Default Chrome/Electron flags | `packages/server/lib/util/chromium_flags.ts` |
| Firefox launch + preferences + BiDi/geckodriver | `packages/server/lib/browsers/firefox.ts` |
| WebKit launch + unsupported features | `packages/server/lib/browsers/webkit.ts` |
| Error copy (CDP, Chrome 137, browser-not-found) | `packages/errors/src/errors.ts` |
