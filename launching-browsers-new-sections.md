# Proposed new sections for "Launching Browsers"

Paste-ready Markdown for the four sections identified as missing in
`launching-browsers-accuracy-review.md`. Wording follows the Cypress docs
voice. Code references are included as HTML comments for the docs reviewer and
should be removed before publishing.

---

## Headless mode

When you run `cypress run`, Cypress launches some browsers headlessly by
default — they execute the full test run without opening a visible window. This
is what makes Cypress suitable for CI environments that have no display.

- **Electron** runs headlessly by default during `cypress run`. Pass
  [`--headed`](/app/references/command-line#cypress-run-headed) to make it
  visible.
- **Chrome, Chromium, and Edge** are launched with Chrome's headless mode. On
  **Chrome 112 and newer**, Cypress uses the modern `--headless=new` mode,
  which renders identically to headed Chrome. On older versions it falls back
  to the legacy `--headless` mode.
- **Firefox** is launched with `-headless`.

`cypress open` (interactive mode) always runs the browser headed.

### Headless rendering defaults

To keep screenshots and video deterministic across machines, Cypress pins the
headless viewport. For Chrome-family browsers it sets a default window size of
**1280×720** and forces the device pixel ratio to **1**. You can override the
test viewport with the [`viewportWidth`](/app/references/configuration#Viewport)
and `viewportHeight` configuration options.

If a test passes headed but fails headless (or vice versa), it is almost always
a rendering or timing difference between the two modes. Re-run with `--headed`
to reproduce interactively, and capture a screenshot at the point of failure to
compare.

<!--
Source: packages/server/lib/browsers/chrome.ts:408-422
  - --headless=new for majorVersion >= 112 (CHROME_VERSION_INTRODUCING_HEADLESS_NEW), else --headless
  - --window-size=1280,720 (issue #6210)
  - --force-device-scale-factor=1 (issue #17375)
Source: packages/server/lib/browsers/firefox.ts:478  (-headless)
-->

---

## Downloading files

Cypress configures every supported browser to **download files automatically**,
without showing the browser's native "Save As" prompt. Files are saved to the
folder defined by the
[`downloadsFolder`](/app/references/configuration#Downloads) configuration
option, which defaults to `cypress/downloads`.

This applies across browser families:

- **Chrome, Chromium, Edge, and Electron** — Cypress sets the Chrome DevTools
  Protocol download behavior to `allow` and points it at `downloadsFolder`, so
  any download proceeds straight to disk.
- **Firefox** — Cypress sets `browser.download.dir` to `downloadsFolder`,
  selects "save to a specified directory" (`browser.download.folderList: 2`),
  hides the download manager, and adds essentially all known MIME types to
  `browser.helperApps.neverAsk.saveToDisk` so no content type triggers a
  prompt.
- **WebKit** (experimental) — Cypress listens for Playwright download events and
  writes the downloaded file into `downloadsFolder`.

Because of this, you can assert on a downloaded file directly from the file
system, for example with [`cy.readFile()`](/api/commands/readfile):

```js
it('downloads the report', () => {
  cy.get('[data-cy="download-report"]').click()
  cy.readFile('cypress/downloads/report.pdf').should('exist')
})
```

> If a download seems to be missing, confirm the browser is actually serving it
> as a download (a `Content-Disposition: attachment` response or a known
> downloadable MIME type) rather than rendering it in the tab.

<!--
Source (Chrome/Electron): packages/server/lib/browsers/chrome.ts:270-307
  Page.setDownloadBehavior { behavior: 'allow', downloadPath: downloadsFolder }
Source (Firefox): packages/server/lib/browsers/firefox.ts:261, 316-323, 509
  browser.download.manager.showWhenStarting: false
  browser.download.folderList: 2
  browser.helperApps.neverAsk.saveToDisk: <all known mime types>
  browser.download.dir: options.downloadsFolder
Source (WebKit): packages/server/lib/browsers/webkit-automation.ts:193-197
-->

---

## Skipping Chrome preference reads/writes

To make Chrome behave consistently, Cypress reads and writes a few files in the
browser profile (`Default/Preferences`, `Default/Secure Preferences`, and
`Local State`) — for example to disable the "Save address" / "Save card"
autofill popups and welcome/promotional content.

In rare cases, the application under test **encrypts the Chrome user-data
directory**, which prevents Cypress from reading those preference files and
causes browser relaunches between specs to fail. For this situation, set the
`IGNORE_CHROME_PREFERENCES` environment variable before running Cypress:

```shell
IGNORE_CHROME_PREFERENCES=1 npx cypress run --browser chrome
```

When this variable is set, Cypress skips reading and writing the Chrome
preference files entirely. As a side effect, the default preference tweaks
above are not applied, so you may see Chrome's autofill or promotional prompts.

This option affects Chrome-family browsers only (Chrome, Chromium, Chrome for
Testing, and Edge).

<!--
Source: packages/server/lib/browsers/chrome.ts:52-73 (default prefs written),
        :83-87 and :143-147 (IGNORE_CHROME_PREFERENCES skips read/write)
Context: cypress-io/cypress#29330
-->

---

## Troubleshooting: "Cypress failed to make a connection to the Chrome DevTools Protocol"

Cypress controls Chrome, Chromium, and Edge through the **Chrome DevTools
Protocol (CDP)** over a remote debugging port. After launching the browser,
Cypress retries the CDP connection for up to **50 seconds**; if it never
connects, the run fails with:

```text
Cypress failed to make a connection to the Chrome DevTools Protocol
after retrying for 50 seconds.
```

The most common cause in managed/enterprise environments is **remote debugging
being disabled by an enterprise or group policy**. Cypress cannot drive the
browser without it. To check:

1. Open `chrome://policy` (or `edge://policy` for Edge) in the affected
   browser.
2. Look for the **`RemoteDebuggingAllowed`** policy.
3. Ensure it is either **undefined** or set to **enabled/`true`**. If it is set
   to disabled, Cypress will not be able to connect.

This policy applies only to the standalone Chrome and Edge browsers — it does
**not** affect the bundled **Electron** browser, so switching to
`--browser electron` is a useful way to confirm whether a policy is the cause.

Other things to check if the policy is not the issue:

- Network/firewall rules blocking `127.0.0.1` connections on the remote
  debugging port.
- Security software that closes or sandboxes the browser process immediately
  after launch.

See [Troubleshooting](/app/references/troubleshooting) for more browser launch
problems.

<!--
Source: packages/errors/src/errors.ts:1182-1211 (CDP_COULD_NOT_CONNECT)
  - "retrying for 50 seconds"
  - RemoteDebuggingAllowed + chrome://policy / edge://policy hint
  - hint suppressed for Electron (browserName === 'electron')
-->
