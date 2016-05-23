slug: browser-management
excerpt: How and why Cypress manages the browser session while running tests

# Contents

- :fa-angle-right: [Managing Browsers](#section-managing-browsers)
- :fa-angle-right: [Launching Browsers](#section-launching-browsers)
  - [Unsupported Browsers](#section-unsupported-browsers)
- :fa-angle-right: [Clean Testing Environment](#section-clean-testing-environment)
  - [Cypress Profile](#section-cypress-profile)
  - [Testing Barriers](#section-removing-testing-barriers)
  - [Tabbed Browsing](#section-tabbed-browsing)
- :fa-angle-right: [Automation API's](#section-automation-apis)
  - [Cypress Extension](#section-cypress-extension)
  - [Browser Drivers](#section-browser-drivers)
  - [No Selenium Server](#section-no-selenium-server)

***

# Managing Browsers

When you're ready to start testing, Cypress launches the browser for you. It does this for two main reasons:

1. To create a clean, pristine testing environment.
2. To access the exclusive browser API's for automation.

# Launching Browsers

When Cypress is initially [run from the Desktop application](https://on.cypress.io/guides/installing-and-running#section-logging-in), you can choose to run Cypress in a select number of browsers including:

- Chrome
- Chromium
- Canary

<animated gif of browsers opening>

We'll automatically detect available browsers based on your OS. In `Linux` we detect browsers by their executable binary, and in `OSX` we'll automatically find them even if they aren't in your `/Applications` folder.

[block:callout]
{
  "type": "warning",
  "body": "I'm confused which is the Cypres profile and which is my own profile!"
}
[/block]

You might notice that if you already have the browser open you will see two icons of the same browser in your Dock.

<screenshot of multiple browsers with same icon>

We understand that when Cypress is running in its own profile it can be confusing telling the difference from your normal browser and Cypress. For this reason we recommend [downloading Chromium](https://download-chromium.appspot.com/) or [downloading Canary](https://www.google.com/chrome/browser/canary.html). These browsers both have different icons from the standard Chrome browser and it'll be much easier to tell the difference.

<screenshot of chrome/chromium/canary alonside each other>

Additionally, we've made the browsers spawned by Cypress look different than regular sessions. You'll see a darker theme around the chrome of the browser. You'll always be able to visually distinguish these.

<screenshot of darker theme>

## Unsupported Browsers

<screenshot of trying to visit cypress outside a supported browser>

# Clean Testing Environment

When we launch browsers we open them in a way that makes testing more reliable and accessible. We do this in three ways:

1. Creating an isolated testing profile
2. Disabling virtually everything that gets in the way of testing
3. Enabling access to browser automation API's

## Cypress Profile

For instance we generate our own isolated profile away from your regular browsing. This means things like `history` entries, `cookies`, and **3rd party extensions** will not affect Cypress.

[block:callout]
{
  "type": "warning",
  "body": "Wait, I need my developer extensions such as React Dev Tools, Batarang, or Ember Inspector!"
}
[/block]

That's no problem - you simply have to reinstall them **once**. We'll continue to use this Cypress testing profile on subsequent launches so all of your configuration will automatically be preserved.

## Testing Barriers

Cypress automatically disables certain functionality in your browser which can get in the way of automated testing. For instance it will automatically:

**Ignore certificate errors**

**Allow blocked pop-ups**

**Disable 'Saving passwords'**

**Disable 'Autofill forms and passwords'

**Disable asking to become your primary browser**

**Disable language translations**

**Disable restoring sessions**

**Disable a ton of background network traffic**

**Disable background and renderer throttling**

## Tabbed Browsing

# Automation API's

## Cypress Extension
<talk about not using the debugger protocol>

## Browser Drivers

## No Selenium Server

