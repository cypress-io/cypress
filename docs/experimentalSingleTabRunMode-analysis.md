# experimentalSingleTabRunMode: full behavioral comparison

## 1. What happens between specs — side by side

| | **Default (flag = `false`)** — e2e *and* CT | **Single-tab (flag = `true`)** — CT only |
|---|---|---|
| **First spec launch** | Full browser process launch (`browsers.open()`) | Same — full launch |
| **Subsequent spec launch** | `connectToNewSpec()` → opens a **new tab** in the **same process** (`shouldLaunchNewTab = !isFirstSpecInBrowser`) | **No new tab.** `waitForBrowserToConnect` calls `resetBrowserState()` → reconnect protocol → `changeUrlToSpec()` (navigates the *same* tab) |
| **After each non-last spec** | `resetBrowserTabsForNextSpec(shouldKeepTabOpen=true)`: create new blank tab → close old tab → re-attach; then `project.server.reset()` | `project.server.destroyAut()` (tear down the mounted AUT iframe) + `project.server.reset()`. **Tab stays open.** |
| **Last spec** | Close tab (no replacement) + `project.server.reset()` | **Same as default** — close the tab + `project.server.reset()` (ensures clean end-of-run) |
| **Browser process** | Stays alive across specs | Stays alive across specs |
| **Browser storage (cookies/localStorage/cache)** | *Not* explicitly cleared at the spec boundary (same profile, new tab) | **Explicitly cleared** each spec via CDP `Storage.clearDataForOrigin` + `Network.clearBrowserCache` (`resetBrowserState`) |
| **Video** | New recording per spec | One recording object created on the first spec, reused/re-bound between specs |
| **e2e support** | Yes | **No** — errors with `EXPERIMENTAL_SINGLE_TAB_RUN_MODE` |

The single-tab divergence is entirely contained in `packages/server/lib/modes/run.ts` (the `usingExperimentalSingleTabMode` branches in `waitForBrowserToConnect` and `waitForTestsToFinishRunning`). Everything else is shared.

## 2. How e2e behaves between specs (specifically)

- **It does *not* restart the browser process between specs.** The process is kept alive and reused.
- **It opens a *new tab* per spec** — not the same tab. The automation layer creates a fresh blank tab/context *first*, then closes the old one, then re-attaches:
  - **Chrome / Edge / Electron (CDP):** `Target.createTarget('about:blank')` → `Target.closeTarget(old)` → new `CriClient` (`browser-cri-client.ts`).
  - **Firefox (BiDi):** `browsingContextCreate({type:'tab'})` → close old contexts (`bidi_automation.ts`). Firefox additionally re-establishes its BiDi session each spec.
  - **WebKit:** resets the context (or closes the browser on the last spec).
- **A full browser *relaunch* (new process) happens only when:** it's the first spec, the browser **crashed** (`"We detected that the Chrome process just crashed…"`), or there was an **unexpected exit** (`didBrowserPreviouslyHaveUnexpectedExit`).
- **e2e can't use single-tab mode** — it's gated to component testing and throws if set under `e2e`.
- Note: isolation *between tests within a spec* is a separate mechanism — the driver's `testIsolation` (clears cookies/localStorage/page state before each test). The tab-recycling above is about the *spec* boundary.

## 3. Pros & cons

**Default (new tab per spec):**
- ✅ Strongest isolation — every spec gets a fresh tab: clean DOM, fresh JS realm, detached previous page. A spec that leaks globals/listeners/DOM can't bleed into the next.
- ✅ Predictable, production-like "fresh page per spec."
- ❌ Slower for CT — tab teardown/creation, re-attach, and dev-server reconnection per spec. This is exactly why CT was reported ~40–50% slower than Cypress 9 (issue #22353).
- ❌ More CDP/automation churn; Firefox re-establishes its session each spec.

**Single-tab (same tab, navigate):**
- ✅ Much faster CT (up to ~40–50%) — no tab churn, no relaunch, just navigate + targeted resets. Restores the Cypress 9 CT model.
- ✅ Lower automation overhead.
- ❌ Weaker isolation — the same tab and JS realm are reused. Freshness is *emulated* (resetBrowserState + AUT destroy + server.reset), so subtle cross-spec leaks are possible (the #24146 class of bug).
- ❌ CT-only; not available for e2e.
- ❌ Known edge cases: intermittent order-dependent failures (#24146, now addressed on this branch) and WebKit video (#23815).

## 4. Where the gaps are

- **e2e gets no speedup.** Single-tab is CT-only by design — full-page-reload navigation plus the cross-origin/security model make single-tab isolation much harder for e2e. There's no equivalent fast path for e2e specs.
- **WebKit + single-tab video (#23815, still open):** Playwright records one video file per page, but single-tab runs every spec in one page → only the first spec's video is captured. The proposed mitigation (auto-fall-back to multi-tab on WebKit, #25166) was never implemented.
- **Storage asymmetry (counterintuitive):** single-tab *explicitly* clears browser storage between specs (`resetBrowserState`), while the **default path does not** — a new tab shares the same profile, so cookies/localStorage persist across specs and isolation relies on `testIsolation`. So single-tab actually wipes *more* browser-level storage at the spec boundary than default does.
- **The reset asymmetry behind #24146:** single-tab historically skipped `project.server.reset()` between specs (server proxy / pre-request queue / remote-state leakage). That's the fix on this branch.
- **Firefox cost:** even in default mode Firefox recreates its connection each spec — a per-spec cost single-tab would avoid, but single-tab is CT-only.
- **Test coverage:** the default single-tab system-test fixture mounts no real components (it only asserts an AUT-destroy count), so real cross-spec isolation has historically been under-tested — which is why #24146 slipped through.
