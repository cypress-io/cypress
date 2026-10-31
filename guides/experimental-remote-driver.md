# Experimental remote driver

`experimentalRemoteDriver` runs queries, actions and DOM assertions through an agent that the server injects into the AUT over the browser's automation protocol (CDP, WebDriver BiDi, or Playwright for WebKit), instead of from the spec frame. That lets one test drive a cross-origin AUT, its iframes and the tabs it opens without `cy.origin`.

This guide records where the remote driver behaves differently from the legacy driver, and what it can't do yet. Keep it current: any change that adds, removes or changes a difference updates this file in the same commit.

## How it's set up

- **`baseUrl` is required.** Config validation fails without it. Set it to the URL of the app under test.
- **The runner never moves.** It's served from `cypress-runner.<baseUrl's site>` (or Cypress's own `localhost:<port>` when `baseUrl` is localhost or an IP), cross-origin to the AUT, and every `cy.visit` only changes the AUT iframe's `src`. Legacy moves the runner to the first origin a test visits and restarts the test; the remote driver never restarts a test.
- **The AUT iframe is sandboxed**, so the app can't navigate the top frame.
- **Nothing is injected into the AUT** when the project config enables the remote driver. The proxy skips the driver bootstrap, so the app's `document.cookie`, `fetch`, XHR, `frameElement` and timers are its own.
- **The option is read from the project config** for anything decided at launch or by the proxy: the runner's location, AUT injection and WebKit's launch mode. A per-test `experimentalRemoteDriver` override switches the driver code path only, so a test that turns the legacy driver back on in a remote-driver project can't reach the AUT (and a remote-driver test in a legacy project runs against an AUT that still has the injected bootstrap).
- **WebKit** must enable it in the config file. It then launches Playwright in-process, which needs playwright-webkit 1.59.0 or later, and depends on Playwright internals (its utility world, its page's console handling).

## Cookies and storage

- **The app is first-party only on `baseUrl`'s site.** Any other site the test visits is cross-site to the runner, so its cookies are third-party and Chrome partitions its storage, the same as a site visited inside `cy.origin` with the legacy driver. Legacy instead moves the runner to the first site a test visits.

## Commands

`packages/driver/cypress/e2e/cy/remote_driver_commands.cy.ts` runs every command that touches the AUT against a cross-origin AUT, one per test. A command the remote driver doesn't support yet is listed in its `UNSUPPORTED` table with the reason, and skipped; remove the entry when support lands. Results in Chrome, Firefox and WebKit:

| | Commands |
| --- | --- |
| **Work** | `cy.get`, `.find`, `.eq`, `.contains`, `.frame`, `cy.tab`, aliases (`.as` / `cy.get('@alias')`), `.should` (including a callback), `.click`, `.type`, `cy.visit`, `cy.reload`, `cy.go`, `cy.url`, `cy.location`, `cy.hash`, `cy.title`, `cy.viewport`, `cy.session`, every cookie command, `cy.getAllLocalStorage`, `cy.clearAllLocalStorage`, `cy.getAllSessionStorage`, `cy.clearAllSessionStorage`, `cy.press` |
| **Rejected on a remote subject** | traversals (`.first`, `.last`, `.filter`, `.not`, `.children`, `.parent`, `.parents`, `.parentsUntil`, `.closest`, `.siblings`, `.next`, `.nextAll`, `.nextUntil`, `.prev`, `.prevAll`, `.prevUntil`), `.shadow` and the `includeShadowDom` option, `.its`, `.invoke`, `.each`, `.within`, `.then($el => …)` (the subject isn't a jQuery object), and the actions `.dblclick`, `.rightclick`, `.clear`, `.check`, `.uncheck`, `.select`, `.selectFile`, `.focus`, `.blur`, `.submit`, `.trigger`, `.scrollIntoView`, `.scrollTo` |
| **Read the AUT's window directly, so they fail** | `cy.root`, `cy.document`, `cy.focused`, `cy.getByRole`, `cy.scrollTo` (the window), `cy.clearLocalStorage` |
| **Broken** | `cy.screenshot` and `.screenshot` fail with an internal error. In Firefox, a `cy.visit` that only changes the hash never sees a load and times out. |
| **Not needed** | `cy.origin` still runs, but the remote driver reaches a cross-origin AUT without it, so there's no reason to use it. `cy.window` yields a stand-in for `cy.stub` / `cy.spy` (see below). |

Unchanged by the remote driver, and so not probed: commands that never touch the AUT (`cy.request`, `cy.intercept`, `cy.wait`, `cy.task`, `cy.exec`, `cy.fixture`, `cy.readFile`, `cy.writeFile`, `cy.log`, `cy.wrap`, `.spread`, `cy.debug`, `cy.pause`), and limits WebKit already has with the legacy driver (`cy.press` and `cy.origin` aren't supported there).

- **`.frame()`** enters the first element that matches, and each iframe level adds a round trip to every retry.
- **No DOM snapshots** of a cross-origin AUT, so command log time-travel shows nothing for it.

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

- **Errors reach `uncaught:exception` asynchronously**, reported by the browser's protocol rather than a listener in the AUT, so an error after the test's last command may not fail it. The handler's third argument (the promise) is always `undefined`.
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

## Changes that affect every run

These ship with the remote driver work but change behavior without it:

- **Firefox** opens `target=_blank` links as tabs (`browser.link.open_newwindow` = 3) and clamps background tab timers to 4ms instead of 1s.
- **Firefox and WebKit** close leftover tabs before each test, as Chrome does.
- **WebKit** no longer leaves a new tab's first request hanging, so `target=_blank` tabs open.
- **The injected driver bootstrap** does nothing when it can't reach the runner, instead of throwing into the AUT.
- **Chrome and Electron** answer a dialog from a frame Cypress didn't patch, such as an iframe inside the AUT, instead of leaving it to block the page: it's accepted, and a prompt gets `null`. Without the remote driver no Cypress events fire for it.
