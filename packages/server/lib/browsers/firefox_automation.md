# Firefox Automation

## GeckoDriver / WebDriver Classic

### Purpose

Cypress uses [GeckoDriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/index.html) to drive [classic WebDriver](https://w3c.github.io/webdriver) methods, as well as interface with Firefox's [Marionette Protocol](https://firefox-source-docs.mozilla.org/testing/marionette/Intro.html). This is necessary to automate the Firefox browser in the following cases:

* Navigating to the current/next spec URL via [WebDriver Classic](https://w3c.github.io/webdriver).
* Installing the [Cypress web extension](https://github.com/cypress-io/cypress/tree/develop/packages/extension) via the [Marionette Protocol](https://firefox-source-docs.mozilla.org/testing/marionette/Intro.html), which is critical to automating Firefox.

The [WebDriver](https://w3c.github.io/webdriver) methods used come from the [webdriver](https://github.com/webdriverio/webdriverio/tree/main/packages/webdriver) package to drive WebDriver (and in the future, WebDriver BiDi), which also starts the [geckodriver](https://github.com/webdriverio-community/node-geckodriver#readme) for us using the [`wdio:geckodriverOptions`](https://webdriver.io/docs/capabilities/#wdiogeckodriveroptions) capability.

Currently, [Chrome Devtools Protocol](https://chromedevtools.github.io/devtools-protocol/) automates most of our browser interactions with Firefox. However, [CDP will be removed towards the end of 2024](https://fxdx.dev/deprecating-cdp-support-in-firefox-embracing-the-future-with-webdriver-bidi/) now that [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) is fully supported in Firefox 130 and up. [GeckoDriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/index.html) will be the entry point in which Cypress implements [WebDriver BiDi](https://w3c.github.io/webdriver-bidi/) for Firefox.

### Historical Context

Previously, Cypress was using an older package called the [marionette-client](https://github.com/cypress-io/marionette-client), which is near identical to the [mozilla b2g marionette client](https://github.com/mozilla-b2g/gaia/tree/master/tests/jsmarionette/client/marionette-client/lib/marionette). The b2g client hasn't had active development since 2014 and there have been changes to Marionette's server implementation since then. This means the [marionette-client](https://github.com/cypress-io/marionette-client) could break at any time, hence why we have migrated away from it. See [Cypress' migration to WebDriver BiDi within Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1604723) bugzilla ticket for more details.

### Implementation

To consume [`GeckoDriver`](https://firefox-source-docs.mozilla.org/testing/geckodriver/index.html), Cypress installs the [`geckodriver`](https://github.com/webdriverio-community/node-geckodriver#readme) package, a lightweight wrapper around the [geckodriver binary](https://github.com/mozilla/geckodriver), to connect to the Firefox browser. Once connected, `GeckoDriver` is able to send `WebDriver` commands, as well as `Marionette` commands, to the Firefox browser. It is also capable of creating a `WebDriver BiDi` session to send `WebDriver BiDi` commands and receive `WebDriver BiDi` events.

It is worth noting that Cypress patches the [`geckodriver`](https://github.com/webdriverio-community/node-geckodriver#readme) and [`webdriver`](https://github.com/webdriverio/webdriverio/tree/main/packages/webdriver) packages for a few reasons:
* To coincide with our debug logs in order to not print extraneous messages to the console that could disrupt end user experience as well as impact our system tests. These can be turned on by setting the `DEBUG` variable to `cypress-verbose:server:browsers:geckodriver` or `cypress-verbose:server:browsers:webdriver` depending on what needs to be debugged
* Patch top-level awaits to correctly build the app.

Currently, the use of WebDriver Classic is small. To prepare for the implementation of WebDriver BiDi and reduce the need for maintenance code, the methods are implemented via the [webdriver](https://github.com/webdriverio/webdriverio/tree/main/packages/webdriver) package. It's important to note that, unlike Chrome, Firefox is launched via the WebDriver [newSession command](https://w3c.github.io/webdriver#new-session) (via `webdriver` [package](https://github.com/webdriverio/webdriverio/tree/main/packages/webdriver#webdriver-example)).

Since we patch the [`geckodriver`](https://github.com/webdriverio-community/node-geckodriver#readme) and the related [`webdriver`](https://github.com/webdriverio/webdriverio/tree/main/packages) packages, we [`nohoist`](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/) the dependencies. We keep all dependencies related to `webdriver` in the packherd `binary-cleanup` file. One of these preserved dependencies, `edgedriver@5.6.1`  has the same top-level await that `geckodriver` uses, so we need to patch it. We do not consume this package directly. This is just to make sure the binary can build.

## Debugging

To help debug `geckodriver` and `firefox`, the `DEBUG=cypress-verbose:server:browsers:geckodriver,cypress-verbose:server:browsers:webdriver` can be used when launching `cypress`. This will
 * Enable full `stdout` and `stderr` for `geckodriver` (including startup time) and the `firefox` process. The logs will **NOT** be truncated so they may get quite long.
 * Enables the debugger terminal, which will additionally print browser information to the debugger terminal process.
 * enables  `webdriver` debug logs for all commands and events.

 If you are having trouble running firefox, turning on this debug option can be quite useful.
