---
title: Launching Browsers
comments: false
---

When you run tests in Cypress, we launches a browser for you. Cypress launches a real browser for two main reasons:

1. To create a clean, pristine testing environment.
2. To access the exclusive browser API's for automation.

# Available Browsers

When Cypress is initially run from the Desktop application, you can choose to run Cypress in a select number of browsers including:

- {% url "Canary" https://www.google.com/chrome/browser/canary.html %}
- {% url "Chrome" https://www.google.com/chrome/browser/desktop/index.html %}
- {% url "Chromium" https://www.chromium.org/Home %}
- {% url "Electron" https://electron.atom.io/ %}

Cypress automatically detects available browsers on your system (based on your OS).

- `Linux`: detects available browsers by their executable binary
- `OSX`: detects available browser (even if not in `/Applications` folder).

## Electron Browser

In addition to the browsers found on your system, you'll notice that Electron is an available browser. The Electron browser is a version of Chrome that is bundled with {% url "Electron" https://electron.atom.io/ %} (the platform underlying the Cypress app). Cypress runs all headless runs using {% url '`cypress run`' command-line#cypress-run %} in Electron. Launching the Electron browser may be useful for debugging issues that only occur when running headless.

The `Electron` browser does not have its own Dock icon or any chrome (address bar, tabs, bookmarks, etc).

## Unsupported Browsers

Many browsers are not currently supported, but are on our roadmap. You can read an exhaustive explanation about our future cross browser testing strategy {% issue 310 'here' %}.

# Browser Environment

Cypress launches the browser in a way that's different from a regular browser environment. But it launches in a way that we believe makes testing *more reliable* and *accessible*.

## Cypress Profile

Cypress generates its own isolated profile apart from your normal browser profile. This means things like `history` entries, `cookies`, and `3rd party extensions` from your regular browsing session will not affect your tests in Cypress.

{% note warning Wait, I need my developer extensions! %}
That's no problem - you just have to reinstall them **once** in the Cypress launched browser. We'll continue to use this Cypress testing profile on subsequent launches so all of your configuration will be preserved. Note that in the {% urlHash "Electron browser" Electron-Browser %}, while it's possible to use the dev tools, it's not possible to install developer extensions.
{% endnote %}

## Disabled Barriers

Cypress automatically disables certain functionality in the Cypress launched browser that tend to get in the way of automated testing.

***The Cypress launched browser automatically:***

- Ignores certificate errors.
- Allows blocked pop-ups.
- Disables 'Saving passwords'.
- Disables 'Autofill forms and passwords'.
- Disables asking to become your primary browser.
- Disables language translations.
- Disables restoring sessions.
- Disables background network traffic.
- Disables background and renderer throttling.

# Browser Icon

You might notice that if you already have the browser open you will see two of the same browser icons in your Dock.

![switching browsers](/img/guides/switching-between-cypress-and-other-chrome-browser.gif)

We understand that when Cypress is running in its own profile it can be difficult to tell the difference between your normal browser and Cypress.

For this reason we recommend {% url "downloading Chromium" https://www.chromium.org/Home %} or {% url "downloading Canary" https://www.google.com/chrome/browser/canary.html %}. These browsers both have different icons from the standard Chrome browser and it'll be much easier to tell the difference. You can also use the bundled {% urlHash "Electron browser" Electron-Browser %}, which does not have a Dock icon.

![switch canary](/img/guides/switching-cypress-browser-and-canary-browser.gif)

Additionally, we've made the browsers spawned by Cypress look different than regular sessions. You'll see a darker theme around the chrome of the browser. You'll always be able to visually distinguish these.

![Cypress Browser with darker chrome](/img/guides/cypress-browser-chrome.png)
