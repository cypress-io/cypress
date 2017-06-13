---
title: Browser Management
comments: false
---

When you run tests in Cypress, we launches a browser for you. Cypress launches a real browser for two main reasons:

1. To create a clean, pristine testing environment.
2. To access the exclusive browser API's for automation.

# Launching Browsers

When Cypress is initially run from the Desktop application, you can choose to run Cypress in a select number of browsers including:

- [Canary](https://www.google.com/chrome/browser/canary.html)
- [Chrome](https://www.google.com/chrome/browser/desktop/index.html)
- [Chromium](https://www.chromium.org/Home)
- [Electron](https://electron.atom.io/)

![open browsers](https://cloud.githubusercontent.com/assets/1268976/15519992/11fa3c36-21d2-11e6-9557-9b0f4139ac70.gif)

Cypress automatically detects available browsers on your system (based on your OS).

- `Linux`: detects available browsers by their executable binary
- `OSX`: detects available browser (even if not in `/Applications` folder).

## Electron Browser

In addition to the browsers found on your system, you'll notice that Electron is an available browser. The Electron browser is a version of Chrome that is bundled with [Electron](https://electron.atom.io/) (the platform underlying the Cypress app). Cypress runs all headless runs using {% url '`cypress run`' cli-tool#cypress-run %} in Electron. Launching the Electron browser may be useful for debugging issues that only occur when running headless.

The `Electron` browser does not have its own Dock icon or any chrome (address bar, tabs, bookmarks, etc).

## Unsupported Browsers

Many browsers are not currently supported, but are on our roadmap. You can read an exhaustive explanation about our future cross browser testing strategy [here](https://github.com/cypress-io/cypress/issues/310).

# Browser Environment

Cypress launches the browser in a way that's different from a regular browser environment. But it launches in a way that we believe makes testing *more reliable* and *accessible*.

## Cypress Profile

Cypress generates its own isolated profile apart from your normal browser profile. This means things like `history` entries, `cookies`, and `3rd party extensions` from your regular browsing session will not affect your tests in Cypress.

{% note warning Wait, I need my developer extensions! %}
That's no problem - you just have to reinstall them **once** in the Cypress launched browser. We'll continue to use this Cypress testing profile on subsequent launches so all of your configuration will be preserved. Note that in the [Electron browser](#section-electron-browser), while it's possible to use the dev tools, it's not possible to install developer extensions.
{% endnote %}

## Disabled Barriers

Cypress automatically disables certain functionality in the Cypress launched browser that tend to get in the way of automated testing.

**The Cypress launched browser automatically:**

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

![switching browsers](https://cloud.githubusercontent.com/assets/1268976/15520492/b812cfe6-21d4-11e6-8764-831f33bd0acf.gif)

We understand that when Cypress is running in its own profile it can be difficult to tell the difference between your normal browser and Cypress.

For this reason we recommend [downloading Chromium](https://download-chromium.appspot.com/) or [downloading Canary](https://www.google.com/chrome/browser/canary.html). These browsers both have different icons from the standard Chrome browser and it'll be much easier to tell the difference. You can also use the bundled [Electron browser](#section-electron-browser), which does not have a Dock icon.

![switch canary](https://cloud.githubusercontent.com/assets/1268976/15520491/b812bfe2-21d4-11e6-99ea-c77dae947b26.gif)

Additionally, we've made the browsers spawned by Cypress look different than regular sessions. You'll see a darker theme around the chrome of the browser. You'll always be able to visually distinguish these.

![screen shot 2016-05-24 at 5 25 19 pm](https://cloud.githubusercontent.com/assets/1268976/15520464/936b3976-21d4-11e6-8aca-33d05f2c2a8b.png)
