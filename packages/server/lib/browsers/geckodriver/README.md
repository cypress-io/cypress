# GeckoDriver

## Purpose

Cypress uses [GeckoDriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/index.html) to drive [classic WebDriver](https://w3c.github.io/webdriver.) methods, as well as interface with Firefox's [Marionette Protocol](https://firefox-source-docs.mozilla.org/testing/marionette/Intro.html). This is necessary to automate the Firefox browser in the following cases:

* Navigating to the current/next spec URL via [WebDriver Classic](https://w3c.github.io/webdriver.).
* Installing the [Cypress web extension](https://github.com/cypress-io/cypress/tree/develop/packages/extension) via the [Marionette Protocol](https://firefox-source-docs.mozilla.org/testing/marionette/Intro.html), which is critical to automating Firefox.

Currently, [Chrome Devtools Protocol](https://chromedevtools.github.io/devtools-protocol/) automates most of our browser interactions with Firefox. However, [CDP will be removed towards the end of 2024](https://fxdx.dev/deprecating-cdp-support-in-firefox-embracing-the-future-with-webdriver-bidi/) now that [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) is fully supported in Firefox 130 and up. [GeckoDriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/index.html) will be the entry point in which Cypress implements [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) for Firefox.

## Historical Context

Previously, Cypress was using an older package called the [marionette-client](https://github.com/cypress-io/marionette-client), which is near identical to the [mozilla b2g marionette client](https://github.com/mozilla-b2g/gaia/tree/master/tests/jsmarionette/client/marionette-client/lib/marionette). The b2g client hasn't had active development since 2014 and there have been changes to Marionette's server implementation since then. This means the [marionette-client](https://github.com/cypress-io/marionette-client) could break at any time, hence why we have migrated away from it. See [Cypress' migration to WebDriver BiDi within Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1604723) bugzilla ticket for more details.

## Implementation

To consume [`GeckoDriver`](https://firefox-source-docs.mozilla.org/testing/geckodriver/index.html), Cypress installs the [`geckodriver`](https://github.com/webdriverio-community/node-geckodriver#readme) package, a lightweight wrapper around the [geckodriver binary](https://github.com/mozilla/geckodriver), to connect to the Firefox browser. Once connected, `GeckoDriver` is able to send `WebDriver` commands, as well as `Marionette` commands, to the Firefox browser. It is also capable of creating a `WebDriver BiDi` session to send `WebDriver BiDi` commands and receive `WebDriver BiDi` events.

It is worth noting that Cypress patches the [`geckodriver`](https://github.com/webdriverio-community/node-geckodriver#readme) package for a few reasons:
* To coincide with our debug logs in order to not print extraneous messages to the console that could disrupt end user experience as well as impact our system tests.
* Patch top-level awaits to correctly build the app.
* Pass process spawning arguments to the geckodriver process (which is a child process of the main process) in order to set `MOZ_` prefixed environment variables in the browser. These cannot be set through the [env capability](https://developer.mozilla.org/en-US/docs/Web/WebDriver/Capabilities/firefoxOptions#env_object) and must be done through `geckodriver` as `geckodriver` spawns the `firefox` process. Please see [this comment](https://bugzilla.mozilla.org/show_bug.cgi?id=1604723#c20) for more details.

Currently, since the use of WebDriver Classic is so miniscule, the methods are implemented using direct fetch calls inside the [WebDriver Classic Class](../webdriver-classic/index.ts). It's important to note that, unlike Chrome, Firefox is launched via the WebDriver [newSession command](https://w3c.github.io/webdriver.#new-session) As BiDi development occurs and to reduce maintenance cost, using an already implemented client like [`webdriver`](https://www.npmjs.com/package/webdriver) will be explored.

Since we patch the [`geckodriver`](https://github.com/webdriverio-community/node-geckodriver#readme) package, we [`nohoist`](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/) the dependency. This mostly works with sub-dependencies, but one of the dependencies, `pump@^3.0.0` (from `geckodriver` -> `tar-fs` -> `pump`) is missing from the binary. To workaround this, we install `pump` in `@packages/server` and `nohoist` the dependency so it is available in the binary as a production dependency.

## Debugging

To help debug `geckodriver` and `firefox`, the `DEBUG=cypress-verbose:server:browsers:geckodriver` can be used when launching `cypress`. This will
 * Enable full `stdout` and `stderr` for `geckodriver` (including startup time) and the `firefox` process. The logs will **NOT** be truncated so they may get quite long.
 * Enables the debugger terminal, which will additionally print browser information to the debugger terminal process.

 If you are having trouble running firefox, turning on this debug option can be quite useful.
