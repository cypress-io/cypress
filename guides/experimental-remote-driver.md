# Experimental remote driver

`experimentalRemoteDriver` runs queries, actions and DOM assertions through an agent that the server injects into the AUT over the browser's automation protocol (CDP, WebDriver BiDi, or Playwright for WebKit), instead of from the spec frame. That lets one test drive a cross-origin AUT, its iframes and the tabs it opens without `cy.origin`.

This guide records where the remote driver behaves differently from the legacy driver, and what it can't do yet. Keep it current: any change that adds, removes or changes a difference updates this file in the same commit.

## How it's set up

- **`baseUrl` is required.** Config validation fails without it. Set it to the URL of the app under test.
- **The runner never moves.** It's served from `cypress-runner.<baseUrl's site>` (or Cypress's own `localhost:<port>` when `baseUrl` is localhost or an IP), cross-origin to the AUT, and every `cy.visit` only changes the AUT iframe's `src`. Legacy moves the runner to the first origin a test visits and restarts the test; the remote driver never restarts a test.
- **The AUT iframe is sandboxed**, so the app can't navigate the top frame.
- **Nothing is injected into the AUT** when the project config enables the remote driver. The proxy skips the driver bootstrap for the AUT and every frame inside it, so the app's `document.cookie`, `fetch`, XHR, `frameElement` and timers are its own. The one exception is a run that records to Test Replay, which injects its recorder (see Test Replay).
- **The option is read from the project config** for anything decided at launch or by the proxy: the runner's location, AUT injection and WebKit's launch mode. A per-test `experimentalRemoteDriver` override switches the driver code path only, so a test that turns the legacy driver back on in a remote-driver project can't reach the AUT (and a remote-driver test in a legacy project runs against an AUT that still has the injected bootstrap).
- **WebKit** must enable it in the config file. It then launches Playwright in-process, which needs playwright-webkit 1.59.0 or later, and depends on Playwright internals (its utility world, its page's console handling).

## Cookies and storage

- **The app is first-party only on `baseUrl`'s site.** Any other site the test visits is cross-site to the runner, so its cookies are third-party and Chrome partitions its storage, the same as a site visited inside `cy.origin` with the legacy driver. Legacy instead moves the runner to the first site a test visits.

## Commands

`packages/driver/cypress/e2e/cy/remote_driver_commands.cy.ts` runs every command that touches the AUT against a cross-origin AUT, one per test. A command the remote driver doesn't support yet is listed in its `UNSUPPORTED` table with the reason, and skipped; remove the entry when support lands. Results in Chrome, Firefox and WebKit:

| | Commands |
| --- | --- |
| **Work** | `cy.get` (including `includeShadowDom`), `.find`, `.eq`, `.contains`, every other traversal (`.first`, `.last`, `.filter`, `.not`, `.children`, `.parent`, `.parents`, `.parentsUntil`, `.closest`, `.siblings`, `.next`, `.nextAll`, `.nextUntil`, `.prev`, `.prevAll`, `.prevUntil`), `.shadow`, `.frame`, `cy.tab`, `cy.root`, `cy.focused`, `cy.document`, `cy.getByRole`, aliases (`.as` / `cy.get('@alias')`), `.should` (including a callback), `.then`, `.each`, `.within`, `.its`, `.invoke`, `.click`, `.dblclick`, `.rightclick`, `.type`, `.clear`, `.check`, `.uncheck`, `.select`, `.selectFile`, `.focus`, `.blur`, `.submit`, `.trigger`, `.scrollIntoView`, `.scrollTo` (an element or the window), `cy.visit`, `cy.reload`, `cy.go`, `cy.url`, `cy.location`, `cy.hash`, `cy.title`, `cy.viewport`, `cy.session`, `cy.screenshot` and `.screenshot`, every cookie command, every storage command, `cy.press` |
| **Not needed** | `cy.origin` still runs, but the remote driver reaches a cross-origin AUT without it, so there's no reason to use it. `cy.window` yields a stand-in for `cy.stub` / `cy.spy` (see below). |

Unchanged by the remote driver, and so not probed: commands that never touch the AUT (`cy.request`, `cy.intercept`, `cy.wait`, `cy.task`, `cy.exec`, `cy.fixture`, `cy.readFile`, `cy.writeFile`, `cy.log`, `cy.wrap`, `.spread`, `cy.debug`, `cy.pause`), and limits WebKit already has with the legacy driver (`cy.press` and `cy.origin` aren't supported there).

Where the commands that work behave differently from the legacy driver:

- **`.then($el => …)`, `.each(($el) => …)` and `.within(($el) => …)` hand the callback a read-only snapshot** of the elements, taken when the command runs, which is what a `.should(callback)` gets too. It answers `length`, `text()`, `html()`, `val()`, `attr()`, `prop()` (`id`, `checked`, `selected`, `disabled`, `value`, `tagName`), `is()` with the common pseudo-selectors, `hasClass()`, and `eq()` / `first()` / `last()`. Every other jQuery method, and indexing (`$el[0]`), throws an error pointing to `.invoke()` / `.its()`. `cy.wrap($el)` acts on the element again. Queries inside `.within()` are scoped to its subject.
- **`cy.document()`** yields a remote subject for the AUT's document. `.its()` and `.invoke()` read the document itself (`cy.document().its('title')`) and `.find()` searches it, but a callback or assertion gets a snapshot, so `.should('have.property', 'title')` or `.then((doc) => doc.title)` doesn't read the document.
- **`cy.getByRole()`** matches in the AUT. Its `name` can't be a function, and a failure doesn't list the roles on the page.
- **`.its()` and `.invoke()` run in the AUT.** Their results come back as JSON: an `.invoke()` that returns the subject (`.invoke('show')`) yields the subject, `.its(1)` yields that element, and any other element becomes a description such as `<li#two>`. `.invoke()` can't take a function argument.

- **Traversals** run in the AUT, so their arguments must be selectors or numbers. Passing an element, jQuery object or function fails with an error.
- **`.check()` / `.uncheck()` with values** yield the whole subject, not only the matching elements.
- **`.select()`** matches options once, after the `<select>` passes actionability, instead of retrying until a matching option appears, and doesn't click each matched `<option>`.
- **`.selectFile()`** sends the files' contents to the AUT as base64.
- **`cy.clearLocalStorage()`** yields `null` rather than the AUT's `Storage` object.
- **A `cy.visit()` that only changes the hash** waits until automation reports the new URL, instead of listening for `hashchange` in the AUT's window.
- **`cy.screenshot()`** has the agent scroll the AUT, add blackouts and pause animations. Its `onBeforeScreenshot` / `onAfterScreenshot` callbacks get an empty jQuery object instead of the element or the AUT's document element, and `.screenshot()` on a remote subject that matches several elements captures the first rather than failing.
- **`cy.$$(selector)` and `Cypress.$(selector)` fail with an error.** Without a context, jQuery searches the runner's document, not the cross-origin AUT's. Building elements from HTML (`Cypress.$('<div>')`) and wrapping elements still work.
- **The `match` assertion** (`.should('match', selector)`) isn't supported on a remote element.
- **`.frame()`** enters the first element that matches, and each iframe level adds a round trip to every retry.
- **No DOM snapshots** of a cross-origin AUT, so command log time-travel shows nothing for it.
- **Navigations are reported by the browser's protocol**, not by listeners in the AUT. A page load the app starts adds a "page load" log and makes the next command wait for it, and a URL change without a page load adds a "new url" log, as in legacy. The differences:
  - `window:before:unload` and `window:unload` don't fire.
  - The "new url" log's "Url Updated By" is `hashchange` or `history` rather than `pushState` / `replaceState`.
  - The report arrives asynchronously, so a command queued right after the click that started a page load may run before the page starts unloading.
  - WebKit has no event for a URL change within a document, so it counts any AUT frame navigation without a navigation request in flight as one.
  - Firefox reports `history.pushState` and `replaceState` only in releases with `browsingContext.historyUpdated`.

## Tabs

- **`cy.tab(url?)`** drives a tab or popup the app opens; legacy can't drive another tab at all.
- **Electron** doesn't support `cy.tab()`.
- **`cy.url`, `cy.title`, `cy.reload`, `cy.go` and screenshots** act on the AUT, not on the tab from `cy.tab()`.
- **The newest matching tab** is used, and tabs aren't brought to the front.

## `cy.visit` callbacks

- **`onBeforeLoad` and `onLoad` run inside the AUT's own window**, sent as source. They can't use the test's variables, closures or commands such as `cy.stub`; values come in through the new `args` option (JSON) as their second argument.
- **`onBeforeLoad`** runs before the AUT's scripts in the document the visit loads. On playwright-webkit too old to remove an init script, it also runs on later AUT loads.
- **`window:before:load` doesn't fire**, since nothing is injected to fire it. `window:load` fires with the cross-origin window.

## Uncaught errors

- **Errors reach `uncaught:exception` asynchronously**, reported by the browser's protocol rather than a listener in the AUT. Before each test or hook ends, the driver waits for one round trip to the AUT (up to 1s) and for the errors the browser had already reported, so an error thrown by the last command still fails it. The handler's third argument (the promise) is always `undefined`.
- **Firefox** reports an unhandled rejection as a plain error, without the "unhandled promise rejection" note.
- **WebKit** doesn't report unhandled rejections (they carry no location to tell the AUT's from the spec's), and attributes an error to the AUT when its script isn't on the runner's origin, so errors from the AUT's own iframes count too.
- **Firefox's preload-script error** "Permission denied to access property "length"" is filtered when it has no stack, so an AUT error with exactly that text and no stack would be missed.

## Dialogs

- **The server answers every dialog straight away**, because an open dialog blocks the runner too when they share a renderer process: alerts and confirms are accepted, `beforeunload` is accepted, and prompts get `null`. Legacy leaves prompts as real, blocking dialogs.
- **`window:alert`, `window:confirm` and `window:confirmed` fire afterwards**, as notifications. A `window:confirm` handler that returns `false` can't refuse the confirm; Cypress warns and suggests `cy.stub(win, 'confirm').returns(false)`, which replaces `confirm` so no dialog opens.
- **Headed runs** briefly show the real dialog.

## `cy.stub` and `cy.spy`

- **`cy.window()` yields a stand-in** that only records the property path it's read along, for `cy.stub(win, 'open')` or `cy.spy(win.console, 'log')`. Reading values from it doesn't work.
- **A recorder in the AUT** replaces the method and reports each call to a sinon spy in the spec, so `.as()`, `cy.get('@alias').should(...)` and the command log work. Calls arrive asynchronously, so assert with `.should()` rather than a bare `expect` right after an action.
- **Arguments and return values are JSON copies.** Functions become named placeholders (so `sinon.match.func` matches), DOM nodes become strings like `<button#id>`, and `this` isn't recorded.
- **Behaviors** are `returns`, `resolves`, `throws`, `rejects`, `callsFake` (run in the AUT, without the test's variables) and `callThrough`, plus their `withArgs` versions. `withArgs` compares arguments as JSON, so sinon matchers aren't supported there.
- **A stub applies to every AUT page loaded during the test**, from before the page's scripts run; legacy stubs live on one window. Before load, only objects that exist at document start (`window`, `console`, `document`) can be stubbed.
- **Only the AUT window can be stubbed this way**, not objects reached through other commands.
- **In Chrome and WebKit the recorder reports through a global**, `window.__cypressRemoteStubCall`, that the app can see. Firefox uses a BiDi channel instead.

## `cy.clock` and `cy.tick`

- **The clock runs in the AUT** (Cypress's `@sinonjs/fake-timers` clock, bundled as `cypress_remote_clock.js`) and is installed in every page the AUT loads while it's on, starting from the time it was created with, as legacy rebinds its clock to each new window.
- **`clock.tick()` returns a promise** of the new time instead of the time itself; use `cy.tick()`, which waits for it. `clock.details()`, used by the command log, returns the state after the last install or tick.
- **`clock.setSystemTime()` and `clock.restore()`** are sent without waiting; later commands still see their effect.
- **Timers in the AUT's own iframes aren't faked**, as with legacy.

## Test Replay

Findings from recording the same spec under both drivers in Chrome and Electron against the cloud stub; nothing here has been fixed yet.

- **Only Chrome and Electron are recorded**, as with the legacy driver.
- **Recording injects into the AUT.** The capture protocol injects its recorder into the AUT's main world over CDP, so "nothing is injected into the AUT" holds only for runs that don't record.
- **The AUT's DOM, network, console and uncaught errors are recorded**, including for a cross-site AUT and its iframes.
- **Commands have no snapshots or highlights**, so selecting a command doesn't jump to its moment in the recording. The protocol takes its snapshot from the runner's view of the AUT's document, which a cross-origin AUT doesn't have.
- **Actions show as pending**, and each reports a capture error, because the agent sends only `{ x, y }` coordinates where the protocol expects the full set.
- **URL changes without a page load, and page loads after the first, were missing.** The command log reports them now; the recording hasn't been checked since.
- **Tabs driven with `cy.tab()` aren't recorded**, since the protocol is connected only to the runner's tab.

## Changes that affect every run

These ship with the remote driver work but change behavior without it:

- **Firefox** opens `target=_blank` links as tabs (`browser.link.open_newwindow` = 3) and clamps background tab timers to 4ms instead of 1s.
- **Firefox and WebKit** close leftover tabs before each test, as Chrome does.
- **WebKit** no longer leaves a new tab's first request hanging, so `target=_blank` tabs open.
- **Chrome and Electron** answer a dialog from a frame Cypress didn't patch, such as an iframe inside the AUT, instead of leaving it to block the page: it's accepted, and a prompt gets `null`. Without the remote driver no Cypress events fire for it.
