# Headless mode

Paste-ready Markdown for the **Headless mode** section of the "Launching
Browsers" reference page. Code references appear as HTML comments for the docs
reviewer and should be removed before publishing.

---

## Headless mode

A headless browser runs your tests to completion without ever opening a visible
window. This is the default for some browsers during `cypress run`, and it's
what lets Cypress run in CI environments that have no display.

| Mode | Browser behavior |
| --- | --- |
| `cypress run` | Runs headless by default (see per-browser notes below) |
| `cypress open` | Always runs **headed** (interactive) |

### Per-browser behavior

- **Electron** runs **headless by default** during `cypress run`. Electron is
  bundled with Cypress, so this is the out-of-the-box experience when you don't
  pass `--browser`. To watch the tests run in a visible Electron window, add the
  [`--headed`](/app/references/command-line#cypress-run-headed) flag:

  ```shell
  npx cypress run --headed
  ```

- **Chrome, Chromium, and Edge** launch with Chrome's modern headless mode,
  `--headless=new`, which uses the same rendering engine as headed Chrome.

- **Firefox** launches headless with `-headless`.

You can also flip the default the other way for Chrome-family and Firefox
browsers — run them headed during `cypress run` with `--headed`, or force a
browser to run headless with the
[`--headless`](/app/references/command-line#cypress-run-headless) flag.

### Headless rendering defaults

So that screenshots and videos are consistent from one machine to the next,
Cypress pins the rendering surface when a Chrome-family browser is headless:

- **Window size:** `1280×720`
- **Device pixel ratio (DPR):** forced to `1`

The window size is the size of the browser's rendering surface, not your test
viewport. Control the viewport your application sees with the
[`viewportWidth` and `viewportHeight`](/app/references/configuration#Viewport)
configuration options.

### Debugging headless-only failures

If a test passes headed but fails headless — or only fails in CI — the cause is
almost always a rendering, sizing, or timing difference between the two modes
rather than a problem with your assertions. To track it down:

1. **Reproduce it headed.** Re-run the failing spec with `--headed` (add
   `--no-exit` to keep the browser open at the end):

   ```shell
   npx cypress run --browser chrome --headed --no-exit --spec "cypress/e2e/my-spec.cy.js"
   ```

2. **Compare the artifacts.** Inspect the screenshot captured at the point of
   failure and the recorded video — differences in element size or visibility
   usually point at a viewport/DPR or layout difference.

3. **Match CI locally.** If it only fails in CI, run with the same browser and
   viewport values your CI uses, and consider running inside the same container
   image to rule out font or rendering differences.

4. **Watch for timing.** Headless runs are often faster; failures that appear
   only headless are frequently missing
   [retry-ability](/app/core-concepts/retry-ability) or a race that a slower
   headed run happens to hide.

<!--
Sources:
  Electron headless default + --headed: cypress run defaults to Electron headless;
    --headed flag (packages/server browser launch; command-line reference).
  Chrome-family headless: packages/server/lib/browsers/chrome.ts:408-413
    --headless=new for Chrome >= 112 (CHROME_VERSION_INTRODUCING_HEADLESS_NEW),
    legacy --headless below that.
  Headless window size + DPR: packages/server/lib/browsers/chrome.ts:415-421
    --window-size=1280,720 (issue #6210); --force-device-scale-factor=1 (issue #17375).
  Firefox headless: packages/server/lib/browsers/firefox.ts:478  (-headless)
-->
