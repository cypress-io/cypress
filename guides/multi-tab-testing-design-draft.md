# Multi-tab testing in Cypress (design draft)

> **Status:** draft for discussion. Nothing here is committed to. Every claim about today’s behavior links to the code as of `develop` at the time of writing, so please check the citation before quoting the claim.

For as long as I’ve been on this project, “Cypress can’t do multiple tabs” has been the trade-off we explain most often. The canonical request, [#6251](https://github.com/cypress-io/cypress/issues/6251), has been open since January 2020, and duplicates keep arriving with the same shape: an OAuth popup, a “print invoice” link with `target="_blank"`, a checkout that hands off to a payment provider in a new window. Our answer has been “stub `window.open`, strip the `target`, or reach for `@cypress/puppeteer`.” Those workarounds are real, but they all ask the user to change or bypass the thing they wanted to test.

So what would it actually take to support this properly? This draft is my attempt to answer that from the code rather than from memory. I spent the research time cataloguing every single-tab assumption across the driver, proxy, runner, reporter, and each browser automation layer (there are more than sixty, listed in the appendix), and then asking which architecture makes the fewest of them lie. My recommendation is below, but I’d genuinely love pushback on it. 🙂

## TL;DR

- **Today, a new tab or window is an “extra target.”** On Chromium we detect it, pass its traffic through the proxy untouched, and close it before the next test. On Firefox and WebKit we don’t even do that. Nothing in the driver, reporter, screenshots, video, or Test Replay knows a second page exists.
- **Real OS-level tabs will never be first-class in our architecture**, because the driver runs inside the Cypress page and the AUT is an iframe. A real tab is outside the page, so `cy.*`, snapshots, and screenshots can’t reach it without a second driver.
- **Recommendation: virtualize tabs the same way we already virtualize `top` and cross-origin.** Intercept `window.open` and `target="_blank"` in the AUT, render the new “tab” as a second AUT iframe inside the runner, and give the driver a notion of an *active tab*. The user gets `cy.tab()` and a tab strip above the AUT, and everything downstream (command log, snapshots, screenshots, video, Test Replay) keeps working because the new tab lives inside the page we already control.
- **Keep the existing extra-target machinery and `@cypress/puppeteer` as the escape hatch** for anything that genuinely escapes the page.
- This is a multi-quarter effort touching seven packages. The phased plan at the end gets to an experimental Chromium-only, same-origin release first, then layers in cross-origin, Firefox/WebKit, and Test Replay.

## 1. Where we are today

### 1.1 The driver has one slot for “the window under test”

The driver models the AUT as a single `state('window')` / `state('document')` pair filled from one iframe: `packages/driver/src/cypress/cy.ts:61-68` and `:495-506`. `cy.visit` sets that iframe’s `src` (`packages/driver/src/cy/commands/navigation.ts:928`), page-load detection hangs off that iframe’s `load` event (`cy.ts:516-641`), and every querying and action command reads the same slot (`packages/driver/src/cy/jquery.ts:13-29`, `cy/commands/querying/querying.ts:186-195`, `cy/commands/actions/type.ts:156`, and so on). Snapshots import from `state('document')` (`packages/driver/src/cy/snapshots.ts:176, 250`), and `cy.reset` between tests preserves exactly one `window`, `document`, and `$autIframe` (`cy.ts:654-683`).

Nothing in the driver touches `window.open` or `_blank`. The only target guard neutralizes `_top` and `_parent` and deliberately leaves `_blank` alone (`packages/driver/src/cy/top_attr_guards.ts:3, 28-30`). The proxy’s HTML rewriter likewise only strips `<base target="_top|_parent">` (`packages/proxy/lib/http/util/regex-rewriter.ts:23-33`). New windows open out-of-band, exactly as the browser wants.

### 1.2 The server sees extra tabs, and mostly ignores them

Chromium is the one place we have infrastructure. `BrowserCriClient` turns on `Target.setAutoAttach` with `waitForDebuggerOnStart` (`packages/server/lib/browsers/browser-cri-client.ts:346-355`) and classifies any new `page` target that isn’t the main tab, DevTools, the Launchpad, or an extension as an *extra target* (`:558-573`). Each one gets its own CRI client and a `Fetch` handler that stamps `X-Cypress-Is-From-Extra-Target` on its requests (`:595-644`). The proxy honors that header by running only basic-auth middleware on requests (`packages/proxy/lib/http/request-middleware.ts:47-58`) and skipping injection, security stripping, cookies, and `cy.intercept` on responses (`response-middleware.ts:206-230`). Before every test, the driver asks the server to close them all (`packages/driver/src/cypress/cy.ts:364-367` → `browser-cri-client.ts:1006-1016`). That was the 13.6.0 work in #28204.

Two details matter for the design:

- Extra targets never get `Network.enable`: “We don’t track child tabs/page network traffic” (`browser-cri-client.ts:483-486`). So no pre-requests, no `cy.intercept`, no command-log entries, no Test Replay capture.
- Electron’s `window.open` path is different again: `setWindowOpenHandler` denies the native window and we open our own child `BrowserWindow`, hidden in run mode and with no automation attached (`packages/server/lib/gui/windows.ts:186-193`, `packages/server/lib/browsers/electron.ts:210-288, 318-324`).

Firefox and WebKit have none of this. `closeExtraTargets` is a no-op on both (`firefox.ts:772-777`, `webkit.ts:184-189`). Firefox’s BiDi layer ignores new top-level browsing contexts entirely (`bidi_automation.ts:164-173`) but subscribes to network events globally, so a popup’s requests flow through the *full* proxy pipeline and can be mis-correlated with AUT requests that share a method and URL (`firefox-util.ts:31`, `prerequests.ts:173, 295`). WebKit keeps a single Playwright `page` and never listens for `context.on('page')` (`webkit-automation.ts:37-39`).

### 1.3 Everything downstream assumes one page

- **Runner UI:** one `AutIframe` singleton with one `$iframe` slot (`packages/app/src/runner/index.ts:77-113`, `aut-iframe.ts:22`), one viewport and scale in the store (`store/aut-store.ts:5-19`, `useRunnerStyle.ts:68-99`), one URL bar.
- **Reporter:** the command model has no window, frame, or tab field (`packages/reporter/src/commands/command-model.ts:29-44`). `cy.origin` is just a log group.
- **Screenshots:** the AUT is un-scaled to `(0,0)` of the top page and `Page.captureScreenshot` is taken on the main target with no clip (`packages/driver/src/cy/commands/screenshot.ts:432-452`, `cdp_automation.ts:585-605`).
- **Video:** `Page.startScreencast` on the main page client (`cdp_automation.ts:99-114`); Firefox records the Cypress tab via `getUserMedia({ mediaSource: 'browser' })` (`driver/src/cy/video-recorder.ts`).
- **Test Replay:** `ProtocolManager.connectToBrowser` receives exactly one CDP client, a clone of the main page target (`packages/server/lib/cloud/protocol.ts:131-175`, `browser-cri-client.ts:824-838`).
- **Proxy attribution:** one `autFrameId` found by scanning the main page’s child frames for the `Your project:` name prefix (`cdp_automation.ts:355-388`), one `Http.autUrl`, one `remoteStates.current()`, one global `__cypress.initial` cookie. The appendix has the full list.

### 1.4 What users get today

`@cypress/puppeteer` (beta) hands the CDP websocket URL to a Node-side Puppeteer session via the undocumented `after:browser:launch` event (`npm/puppeteer/src/plugin/setup.ts:66-74`; the event is deliberately left out of docs, `packages/server/lib/plugins/child/validate_event.ts:59-61`). It is Chromium-only, broken in headed branded Chrome 137+ (#31703), runs in Node so no `cy.*` or DOM access, and requires the user to find the tab with `browser.pages()` and close it themselves (`npm/puppeteer/README.md:48-49, 117, 237, 256-259`). It is a fine escape hatch. It is not multi-tab *testing*.

## 2. The constraint that shapes everything

Why has this been “never” for so long? Because of one architectural fact: **Cypress runs inside the browser page it is testing.** The runner is a web page; the driver is a script in it; the application is an iframe in it. That gives us synchronous DOM access, retry-ability, time-travel snapshots, and the command log. It also means anything outside that page is invisible to `cy.*`.

A real browser tab is outside that page. So there are really only three ways to go, and they differ in *where the second tab lives*:

| | A. Real tabs, driven from Node | B. Real tabs, each wrapped in its own runner shell | C. Virtual tabs inside the runner page (recommended) |
|---|---|---|---|
| What it is | Formalize `@cypress/puppeteer`: server-side CDP/BiDi control of extra targets, exposed as a `cy` command | When a target opens, navigate it to a Cypress shell page that hosts the URL in an AUT iframe with a spec-bridge-style driver | Intercept `window.open`/`_blank` in the AUT and render the new document as a second AUT iframe in the existing runner |
| `cy.*` in the other tab | No (Node only) | Yes, via cross-context messaging like `cy.origin` | Yes, natively; it’s the same driver, pointed at another iframe |
| Command log + snapshots | No | Partial (serialized like `cy.origin`) | Yes |
| Screenshots / video / Replay | Main tab only | Per-target capture needed for each | Works as-is (everything is in one page) |
| `window.opener`, `postMessage` back to opener | Real | Broken: `opener` points at the shell, not the app | Preserved: opener is the other iframe’s `WindowProxy` |
| Browser fidelity (visibility, focus, popup blockers) | Highest | Medium | Lowest; must be simulated |
| Firefox / WebKit | Needs BiDi and Playwright equivalents | Same, plus per-target capture | Same driver code; only the proxy attribution layer differs |
| Effort | Small | Very large | Large |
| Analog we already ship | `@cypress/puppeteer` | none | `cy.origin`, `top` simulation, `_top`/`_parent` guards |

Option C is the one that fits how Cypress already works. We already lie to the application about `top` (`packages/driver/src/cypress/resolvers.ts:55-70`), about `_top` navigation, about `X-Frame-Options`, and about which origin it is on. Virtualizing “a new tab is a new iframe” is the same species of lie, and it is the only option where the command log, snapshots, screenshots, video, and Test Replay come for free. Option A stays as the escape hatch, formalized. Option B is the worst of both.

There’s also something satisfying about the answer to the UX question I raised on #6251 back in 2021. What should the runner *show* when a tab opens? A tab strip. Users already know what that looks like.

## 3. Proposed design: virtual tabs

### 3.1 User-facing API (sketch)

```ts
cy.visit('/orders/42')
cy.contains('Print invoice').click()        // app calls window.open('/invoice/42', '_blank')

cy.tab('/invoice/42')                       // retries until a tab whose URL matches exists, then activates it
cy.get('h1').should('contain', 'Invoice 42')
cy.tab().close()                            // closes the active tab, reactivates its opener

cy.tab('main')                              // explicit switch back; 'main' is the cy.visit tab
cy.tabs().should('have.length', 1)
```

Rules of thumb for the API:

- `cy.tab(match)` is a **query**: it retries until a tab matches (`'main'`, a tab id, a URL substring or glob, `RegExp`, or `{ name }` for `window.open(url, name)`), then makes it the active AUT. It doubles as “wait for the popup,” which is the thing users actually struggle with in every other tool.
- `cy.tab()` with no argument yields the active tab; `cy.tabs()` yields all open tabs as `{ id, url, name, opener, active }` so assertions and `cy.wrap` work.
- Switching is **stateful** (like Selenium’s `switchTo`), not a scoped callback like `cy.origin`. The callback shape exists in `cy.origin` only because the function must be serialized into another JavaScript context. Virtual tabs share the primary driver’s context, so there is no such need, and stateful switching composes better with page objects and custom commands.
- **Cross-origin tabs compose with `cy.origin`**, they don’t replace it. If the popup is on another origin, the user writes `cy.tab(/accounts\.google\.com/)` then `cy.origin('https://accounts.google.com', () => { ... })`. Inside that callback, `cy.*` targets the *active tab’s* window for that origin. (See 3.6.)
- Test isolation closes every tab but `main` before each test, exactly as extra targets are closed today.
- Events: `Cypress.on('tab:open', tab)` and `Cypress.on('tab:close', tab)` for the people who need to react without switching.
- Gated by `experimentalMultiTab: true`, E2E only. Component testing’s AUT iframe *is* the spec iframe (`packages/app/src/runner/index.ts:228-262`), so tabs make no sense there.

### 3.2 How a virtual tab opens

1. The injected runner script in the AUT (`packages/runner/injection/main.js`) patches `window.open` and installs a capture-phase click and submit guard for `target="_blank"` and named targets, next to the existing `_top`/`_parent` guards in `top_attr_guards.ts`. The patch calls into the driver with `{ url, name, features, opener: window }` and **returns a `WindowProxy`** synchronously, because application code does `const w = window.open(...); w.postMessage(...)` and must not see `null`.
2. The driver asks the runner to create an `AutIframe` named `Your project: 'name' (tab 2)`. The `Your project:` prefix is what the proxy and every automation layer already use to recognize an AUT frame, so the new iframe inherits injection and security stripping once those layers accept *a set* of AUT frames instead of one (3.4). The iframe is created **synchronously and blank** so its `contentWindow` can be returned to the caller; the navigation to `url` happens on the next tick.
3. The new document gets full injection like any AUT document. On `window:before:load`, the injected script defines `window.opener` as the opener iframe’s `WindowProxy` (cross-origin frames are still reachable through `parent.frames`, which is how spec bridges find their AUT today: `packages/driver/src/cross-origin/cypress.ts:42-61`), and patches `window.close()`, `window.closed`, `window.focus()`, and `window.name` to talk to the driver.
4. The runner’s tab strip renders one entry per tab; clicking one in open mode is the same as `cy.tab()` from the perspective of the runner (but is not recorded as a command).
5. Same-origin tabs are direct references, so `opener.postMessage`, `BroadcastChannel`, `localStorage` events, and shared cookies all just work, because both iframes are in the same browser profile and, for same-origin, the same agent cluster.

What escapes this? Anything that opens a window without going through the AUT document: a service worker’s `clients.openWindow`, a `noopener` navigation from a cross-origin third-party iframe we didn’t inject, a download that opens a viewer tab, `chrome://` pages. Those remain real extra targets and keep today’s behavior: passed through, then closed before the next test. We should surface them in the command log as a system log (“Cypress noticed a real tab open to `<url>`; it is not controllable, see docs”) instead of staying silent.

### 3.3 Driver: from a window slot to a tab table

The driver change is the heart of the work, and it is mostly indirection.

- Add a `TabManager` in the driver holding `tabs: Map<TabId, { $autIframe, window, document, autLocation, isStable, pageLoading, listenersBound }>` and `activeTabId`. `state('window')`, `state('document')`, `state('$autIframe')`, `state('autLocation')`, `state('isStable')`, and `state('pageLoading')` become computed views over the active tab. Most commands need no change because they read state.
- The `load` handler at `cy.ts:516-641` and `contentWindowListeners` bind per tab. The module-global listener registry in `packages/driver/src/cy/listeners.ts:20-21` (with its `listenersAdded` guard) becomes per-window.
- Stability and page-load detection become per-tab, and `cy.tab()` waits for the *target* tab to be stable. A background tab reloading must not block a command in the active tab, but a `cy.tab()` switch must wait for the load.
- The timer-control hook in `packages/runner/injection/main.js:34-42` currently keeps only the last-loaded window’s timers (`removeAllListeners('app:timers:reset')`). It needs to key by window so `cy.clock` in one tab doesn’t drop the other.
- `cy.visit` in a non-main tab navigates that tab’s iframe; the superdomain-change path that navigates `top` (`navigation.ts:1088-1117`) must be tab-aware or simply disallowed outside `main` (my preference for v1).
- `cy.reset` (`cy.ts:654-683`) and `test:before:run:async` tear down every tab except `main`, restore `main` as active, and remove the extra iframes.
- Snapshots record `tabId` alongside the existing props (`packages/driver/src/cypress/log.ts:19, 438-443`) so restore targets the right iframe. The CSS cache in `snapshots_css.ts:93-108` is keyed by document today and needs one cache per tab.
- `cy.screenshot({ capture: 'viewport' | 'fullPage' })` captures the active tab; `'runner'` captures everything including the tab strip. The runner’s “un-scale and move to `(0,0)`” dance in `AdjustRunnerStyleDuringScreenshot.vue` applies to the active iframe only.

### 3.4 Proxy and automation: a set of AUT frames, not one

Everything that says “is this the AUT frame?” has to answer “is this *an* AUT frame, and which tab?” The name-prefix convention makes the first half nearly free. The second half is new information the proxy has never carried.

- **CDP (`cdp_automation.ts`):** `_findAutFrame` stores one `autFrameId` (`:355-372`). Replace it with a `Map<frameId, tabId>` populated from `Page.getFrameTree` and kept fresh on `frameAttached`/`frameDetached`. `_handlePausedRequests` adds an `X-Cypress-AUT-Tab` header next to `X-Cypress-Is-AUT-Frame` (`:461-484`). The same change applies to the CDP-Fetch transport’s `isAUTFrame` callback (`cdp-fetch-transport.ts:556-565`).
- **BiDi (`bidi_automation.ts:159-179, 271, 466`):** `autContextId` becomes a set keyed the same way; the `network.addIntercept` already covers the whole top-level context, which contains all our iframes.
- **WebKit (`webkit-automation.ts:150-169`):** today “any depth-1 frame whose URL lacks `__cypress`” counts as the AUT, which would already mark a second iframe. It needs the name check plus the tab id.
- **Injection level (`network-interception/lib/core/document-preparation.ts:40-65`):** unchanged in logic, now evaluated per request with the tab’s own `remoteState` (below).
- **Remote state (`packages/network-tools/lib/remote-states.ts`):** the primary/secondary model is per *origin*, not per tab, and that is fine: a second tab on the same origin shares the primary. What becomes per tab is `Http.autUrl` (`packages/proxy/lib/http/index.ts:355, 606`), which top-simulation and SameSite cookie logic read (`util/top-simulation.ts:4-13`, `util/cookies.ts:126-137`). It becomes a map keyed by tab id, looked up from the header.
- **The `__cypress.initial` cookie** (`response-middleware.ts:149-157, 534`) is a global flag that any redirect in any tab flips, and the next HTML document in *any* tab then receives full runner injection. This is already a latent bug with today’s pass-through tabs on Firefox. It needs to become per-tab (a header carried from the paused request, or a cookie suffixed by tab id).
- **Pre-requests** (`packages/proxy/lib/types.ts:82-95`) gain a `tabId` so `cy.intercept` command-log entries and Test Replay can attribute a request to a tab. Since all virtual tabs are frames of the main page target, `Network.requestWillBeSent` already fires for them on the page client; only the frame-to-tab mapping is missing. This is the big payoff of option C: **no new `Network.enable` sessions, no new CDP clients.**
- **`cy.intercept`:** route matching (`network-interception/lib/core/route-matching.ts:96-135`) needs no change; add `req.tab` to the intercepted request so users can match on it if they want.
- **Automation commands** (`packages/server/lib/automation/automation.ts:144-181`) gain an optional `tabId`: `reload:aut:frame`, `navigate:aut:history`, `get:aut:url`, and `key:press` all resolve “the AUT frame” by id today (`cdp_automation.ts:621-630`, `automation/commands/key_press.ts:56`).

### 3.5 Runner, reporter, and media

- **Runner (`packages/app/src/runner`):** `AutIframe` stops being a singleton (`index.ts:77-113`). `#aut-iframes-container` holds N AUT iframes, only the active one visible. `aut-store` tracks `tabs[]` and `activeTabId`; viewport and scale are per tab, since `cy.viewport` inside a popup shouldn’t resize the opener. A tab strip component sits above the AUT, showing name, URL, and a close button in open mode. The snapshot iframes (`aut-iframe.ts:52-66`) stay shared.
- **Reporter:** add an optional `tab` field to `CommandProps`, render a small tab badge on commands that ran outside `main`, and make `cy.tab()` a system-style log like “Clear page.” Pinned and hovered snapshots restore into the recorded tab and switch the visible tab while pinned. The `pinnedSnapshotId` singleton (`reporter/src/lib/app-state.ts:8`) is fine as is.
- **Screenshots, video, Test Replay:** no change to the capture pipeline. This is the whole point of option C. Replay does need the tab id on command logs, viewport events, and pre-requests to render the switch; that is a schema addition on the app-capture side and a coordinated Cloud change.
- **Studio and `cy.prompt`:** both attach to the AUT frame by name and by the snapshot iframes. They should target the active tab. Out of scope for v1 beyond “don’t break.”

### 3.6 Composing with `cy.origin`

Spec bridges are keyed by origin, one bridge per origin (`packages/driver/src/cross-origin/communicator.ts:75, 113-115`), and each bridge finds its AUT by scanning `window.parent.frames` for the first frame with a matching origin and a different `href` (`cross-origin/cypress.ts:42-61`). With two tabs on the same origin, that scan is ambiguous, and the code already carries a comment wishing for “a window identifier.”

Proposed: the primary sends `attach:to:window` with the active tab’s iframe name (`origin/index.ts:222-240`), and the bridge looks up `parent.frames` by name rather than by scan. Each bridge keeps the same per-tab table as the primary (3.3), and `cy.tab()` inside `cy.origin` is disallowed in v1 (add it to `cross-origin/unsupported_apis.ts` next to nested `origin`). The `before:unload` stability check in `event-manager.ts:771-782` compares `autLocation.origin` against the bridge’s origin; it becomes “active tab’s location.”

This ordering also gives us an OAuth-popup story that has never existed: `cy.tab(/idp\.example/)` → `cy.origin('https://idp.example', () => { cy.get('#password').type(...) })` → the popup calls `opener.postMessage` and closes itself → `cy.tab('main')`. Issue #19896 asked for exactly this during the `cy.origin` project and was closed without a path.

### 3.7 Browser-specific notes

- **Chromium and Electron:** the existing extra-target detection and `closeExtraTargets` remain for real escapes. Electron’s `_launchChild` path (`electron.ts:270-288`) should stop opening a native child window once the AUT patch handles `window.open`; it becomes the fallback only.
- **Firefox:** `browser.link.open_newwindow: 2` (`firefox.ts:269`) is irrelevant once `window.open` is patched in-page, but implement `closeExtraTargets` via `browsingContext.close` for escapes so Firefox reaches parity with Chromium on isolation.
- **WebKit:** add `context.on('page')` handling for escapes (close them, log them). `cy.origin` is unsupported on WebKit today (`origin/index.ts:37-39`), so cross-origin tabs are also unsupported there.

## 4. Workstreams and phasing

Rough sizing assumes one to two engineers per workstream and is deliberately coarse. The phases are ordered so that each ships something usable behind the experimental flag.

**Phase 0: spike (2 to 3 weeks).** One engineer, Chromium only, same origin. Patch `window.open` in `main.js`, create a second iframe named with the `Your project:` prefix, hack `_findAutFrame` to return a set, and see what breaks in a real app with a `_blank` link. The goal is a list of surprises, not a PR. The system test `window_open_spec.js` (currently `it.skip`) and its fixture `window_open.html` are the starting fixtures.

**Phase 1: experimental, Chromium, same origin (a quarter).**

| Workstream | Package(s) | Scope |
|---|---|---|
| Driver tab table | `@packages/driver`, `@packages/runner` (injection) | 3.2, 3.3 minus cross-origin |
| Frame-set attribution | `@packages/server` (`cdp-protocol`), `@packages/proxy`, `@packages/network-interception`, `@packages/network-tools` | 3.4 for CDP and the CDP-Fetch transport |
| Runner tab strip | `@packages/app`, `@packages/frontend-shared` | 3.5 runner |
| Reporter tab badge | `@packages/reporter` | 3.5 reporter |
| Types, config, docs | `cli/types`, `@packages/config`, `@packages/errors` | `experimentalMultiTab`, `cy.tab`, `cy.tabs`, error messages for unsupported cases |
| Tests | `packages/driver/cypress`, `system-tests` | popup fixtures across `window.open`, `_blank`, `form target`, named windows, `noopener` |

**Phase 2: cross-origin and isolation hardening (a quarter).** 3.6, per-tab `__cypress.initial`, per-tab `autUrl`, tab-aware `cy.session` clearing, Electron child-window fallback removal. This is where OAuth popups start working.

**Phase 3: Firefox, WebKit, Test Replay (a quarter).** BiDi and Playwright attribution, `closeExtraTargets` parity, tab ids in the protocol schema with the Cloud team, Studio and `cy.prompt` targeting the active tab.

**Graduation.** Follow the usual feature-graduation process; the flag flips on when the phase 3 gaps are closed on every browser we ship, and `@cypress/puppeteer` docs are updated to position it as the escape hatch for real tabs.

## 5. Open questions

I’d rather surface these now than discover them in review:

1. **Query vs. command.** Should `cy.tab(match)` retry as a query (my draft) or be a one-shot command with an explicit `cy.tab(match, { timeout })`? Retrying is friendlier, but a query that mutates driver state (the active tab) is a new pattern for us.
2. **Visibility semantics.** Real background tabs report `document.hidden === true` and throttle timers. Should a non-active virtual tab simulate that? My instinct is yes for `visibilityState` (apps pause polling on it) and no for throttling.
3. **`window.open` features.** `width=600,height=700` in a popup is common. Map it to the tab’s viewport, or ignore it? Mapping it makes the screenshots match what users see in production.
4. **What does `cy.viewport` mean while a popup is active?** Per tab (draft) or global?
5. **How loud should escapes be?** A real tab that opened because we couldn’t intercept it is a silent failure today. A warning log per test seems right; a hard error would be too much for the third-party-iframe case.
6. **Do we still need Electron’s child window at all** once `window.open` is patched? Removing it simplifies `electron.ts` considerably, but it currently gives headed Electron users a visible popup for debugging.
7. **Naming.** `cy.tab` reads well but the thing is often a window, not a tab. `cy.window` is taken. I’m open to `cy.page`, though that collides with Playwright’s vocabulary in a confusing way.

## 6. Non-goals

- Controlling more than one *browser*. That remains a permanent trade-off.
- Making real OS-level tabs first-class. They stay as extra targets, closed between tests, with `@cypress/puppeteer` for the rare case that needs them.
- Component testing.
- Multi-tab inside `cy.origin` callbacks in v1.

## Appendix: inventory of single-tab assumptions

This is the list I built while researching. It is the checklist for whoever picks up phase 1, and a decent measure of why this has felt so daunting: not one hard problem, but sixty small ones that all agree with each other.

### Driver (`packages/driver/src`)

1. `state('window' | 'document' | '$autIframe' | 'autLocation' | 'isStable' | 'pageLoading')` are single slots: `cypress/cy.ts:66-67, 496, 586`; `cy/stability.ts:32-37`; `cy/commands/navigation.ts:174`.
2. `Cypress.initialize({ $autIframe })` and `cy.initialize($autIframe)` take one iframe: `cypress.ts:347, 460`.
3. One `load` handler bound to that iframe: `cypress/cy.ts:516-641`.
4. Module-global listener registry with `listenersAdded` guard: `cy/listeners.ts:20-21, 72-74`.
5. Injected script depends on `parent.Cypress` and keeps only the last window’s timers: `packages/runner/injection/main.js:14, 34-42`.
6. `cy.visit` uses `iframeSrc($autIframe)`; superdomain change navigates `top`: `navigation.ts:928, 754, 1088-1117`.
7. `reload:aut:frame` and `navigate:aut:history` target a single `autFrameId`: `navigation.ts:517, 597`.
8. jQuery `$$` and querying default to `state('document')`: `cy/jquery.ts:15, 29`; `cy/commands/querying/querying.ts:191`.
9. All action, clock, storage, cookie, and location commands read `state('window')`: `type.ts:156`, `trigger.ts:123`, `scroll.ts:59-87`, `selectFile.ts:107-121`, `mouse.ts:607`, `focused.ts:276`, `clock.ts:101`, `storage.ts:13`, `cookies.ts:105`, `location.ts:41`.
10. `top` resolves to the single AUT `contentWindow`: `cypress/resolvers.ts:55-70`.
11. Snapshots and CSS cache use one document and one `newWindow` flag: `cy/snapshots.ts:176, 250, 277`; `cy/snapshots_css.ts:93-108, 181`.
12. Screenshot clip and viewport come from single state and top window: `cy/commands/screenshot.ts:38-45, 432-452`.
13. One `currentViewport`: `cy/commands/window.ts:73-95`.
14. `about:blank` isolation targets one iframe: `cy/commands/sessions/utils.ts:205-219`.
15. `cy.reset` preserves exactly one window/document/iframe: `cypress/cy.ts:654-683`.
16. `close:extra:targets` before every test: `cypress/cy.ts:364-367`.
17. Spec bridges keyed by origin; AUT found by scanning `parent.frames`: `cross-origin/communicator.ts:75, 113-115`; `cross-origin/cypress.ts:42-61`; `packages/runner/injection/cross-origin.js:19-36`.
18. Bridge messages go only to `window.top`: `cross-origin/communicator.ts:338-345`.
19. `currentActiveOrigin` state is written but never read: `cy/commands/origin/index.ts:125, 129`.
20. `_blank` deliberately untouched by target guards: `cy/top_attr_guards.ts:3, 28-30`.

### Server automation (`packages/server/lib`)

21. `currentlyAttachedTarget` plus three clones; identity check decides main vs. extra: `browsers/browser-cri-client.ts:202-205, 564, 702`.
22. `attachToTargetUrl` picks the first exact URL match: `browser-cri-client.ts:816-824`.
23. `page` targets never get `Network.enable`: `browser-cri-client.ts:483-486`; `cdp-protocol/cri-client.ts:827-831`.
24. Extra targets get a raw CRI client and header-only handling: `browser-cri-client.ts:595-644`.
25. Single `frameTree`, `autFrameId`, `executionContexts`; AUT searched in top page’s children only: `cdp-protocol/cdp_automation.ts:76-81, 355-388`.
26. All network, service-worker, and runtime listeners on one page client: `cdp_automation.ts:83-97`.
27. Screenshot, focus, key press, AUT navigation all target the main page: `cdp_automation.ts:585-630`; extension `activateMainTab` finds one tab: `packages/extension/app/v3/service-worker.ts:20-38`.
28. `chrome.ts:605, 671-677, 742-743` and `electron.ts:356, 381, 399, 435, 475` use `currentlyAttachedTarget` only.
29. Electron child windows get no automation; tab reset destroys the window: `browsers/electron.ts:73-84, 210-288, 318-324`.
30. One `_cdpSocket`: `packages/socket/lib/node/cdp-socket.ts:36-39`.
31. Protocol manager receives one CDP client: `cloud/protocol.ts:131-175`; `browser-cri-client.ts:824-838`.
32. One automation middleware and one `automationClient` socket: `automation/automation.ts:191-197`; `socket-base.ts:173`.
33. `AutomationCommands` carry no tab or window identifier: `automation/automation.ts:144-181`.
34. Firefox: `contexts[0]`, single `topLevelContextId`/`autContextId`/`interceptId`, new top-level contexts ignored: `browsers/firefox-util.ts:14, 24, 59, 64`; `browsers/bidi_automation.ts:125-127, 164-173, 271, 730, 788`.
35. Firefox network subscription is global, so popup requests hit the full pipeline: `firefox-util.ts:31`.
36. WebKit: single `page`/`context`, `pages()[0]`, no `on('page')`: `browsers/webkit-automation.ts:37-39, 195, 348, 411`.
37. WebKit marks any depth-1 frame as the AUT: `webkit-automation.ts:150-169`.
38. `closeExtraTargets` no-op on Firefox and WebKit: `browsers/firefox.ts:772-777`; `browsers/webkit.ts:184-189`.
39. Single browser `instance`: `browsers/index.ts:20`.
40. Video source is the main page in every browser: `cdp_automation.ts:99-114`; `electron.ts:129-152`; `packages/driver/src/cy/video-recorder.ts`; `webkit-automation.ts:112-131`.

### Proxy and network (`packages/proxy`, `packages/network-*`, `packages/net-stubbing`)

41. `isAUTFrame` is a boolean from one header, no tab id: `proxy/lib/http/request-middleware.ts:30-36`.
42. Extra-target traffic runs only basic-auth middleware and skips response manipulation: `request-middleware.ts:47-58`; `response-middleware.ts:206-230`.
43. Pre-requests carry no target, session, or frame id and correlate by method plus URL: `proxy/lib/types.ts:82-95`; `proxy/lib/http/util/prerequests.ts:173, 295`.
44. Requests with no pre-request wait 2000 ms (500 ms non-Chromium) then proceed untyped: `prerequests.ts:124, 334-344`; `server/lib/project-base.ts:706-709`.
45. One `remoteStates.current()` and primary: `network-tools/lib/remote-states.ts:89-135`.
46. Global `__cypress.initial` cookie flipped by any redirect: `response-middleware.ts:149-157, 534`; `set-injection-level.ts:23`.
47. Single `Http.autUrl` read by top simulation and SameSite logic: `proxy/lib/http/index.ts:355, 606`; `util/top-simulation.ts:4-13`; `util/cookies.ts:126-137`.
48. Visit buffers keyed by URL only: `request-middleware.ts:146`.
49. `NetStubbingState` is server-global; `toDriver` broadcasts to one primary: `net-stubbing/lib/server/state.ts:4-24`; `server/lib/socket-base.ts:106-110`.
50. Spec bridges have no socket; everything relays through the primary: `driver/src/cross-origin/events/socket.ts:1-24`; `app/src/runner/event-manager.ts:845`.
51. Service-worker manager and credential manager are process-global: `proxy/lib/http/util/service-worker-manager.ts:91-96`.
52. Unload redirect uses the global `__cypress.unload` cookie and primary origin: `request-middleware.ts:172-214`.
53. Network capture for Replay requires a main-target pre-request id: `proxy/lib/adapters/network-capture.ts:16-18`.
54. Interception escape detector ignores extra targets: `proxy/lib/http/util/interception-escape-detector.ts:62-63`.

### Runner, reporter, and app (`packages/app`, `packages/reporter`)

55. `AutIframe.$iframe` single slot and every accessor: `app/src/runner/aut-iframe.ts:22, 101-115`.
56. Module singleton `_autIframeModel` and 1:1 `IframeModel`: `app/src/runner/index.ts:77-113`.
57. Fixed name `Your project: 'Test Project'`: `aut-iframe.ts:39-44`; `index.ts:143-147`.
58. One `#unified-runner` and `#aut-iframes-container`: `index.ts:300-305`; `SpecRunnerOpenMode.vue:89-94`; `SpecRunnerRunMode.vue:54-56`.
59. `aut-store` scalar url/viewport/scale and a single transform: `app/src/store/aut-store.ts:5-19`; `runner/useRunnerStyle.ts:68-99`.
60. `IframeModel` single `originalState`/`detachedId`; reporter single `pinnedSnapshotId`: `runner/iframe-model.ts:105-238`; `reporter/src/lib/app-state.ts:8`.
61. Log snapshot props carry one `url` and viewport: `driver/src/cypress/log.ts:19, 438-443`.
62. Reporter command model has no window, frame, or tab field: `reporter/src/commands/command-model.ts:29-44`.
63. Screenshot un-scale moves the single AUT to `(0,0)`: `app/src/runner/screenshot/AdjustRunnerStyleDuringScreenshot.vue`; `useRunnerStyle.ts:71, 93`.
64. Spec bridges appended to `document.body`, keyed by origin: `app/src/runner/index.ts:201-221`.

### Related history

- 13.5.0: extra-tab requests no longer delayed (#28113). 13.5.1: new-tab response headers (#28293). **13.6.0: extra tabs closed between tests; main tab activated before commands (#28204, #28334).** 13.6.1: basic auth for new tabs (#28350). 13.6.3: extra tabs keep original headers (#28641). 13.7.0: main tab activated before screenshots (#5016). 14.4.0: Chrome 137 breaks `@cypress/puppeteer` headed (#31703).
- Issues: #6251 (canonical, open), #27681 (popups, open, no maintainer reply), #19896 (`cy.origin` + new windows, closed without a path), #15812 (48 comments, closed), #29451 (open).
- Skipped system test: `system-tests/test/window_open_spec.js:7`, fixture `system-tests/projects/e2e/window_open.html`.
- Known hang: basic-auth download in a new tab, `Network.enable` never settles on the extra target (#34512), `packages/driver/cypress/e2e/cypress/downloads_basic_auth.cy.ts:3-17`.
