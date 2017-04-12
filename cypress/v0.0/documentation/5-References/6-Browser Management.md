slug: browser-management
excerpt: How and why Cypress manages your browser

# Contents

- :fa-angle-right: [Managing Browsers](#managing-browsers)
- :fa-angle-right: [Launching Browsers](#launching-browsers)
  - [Unsupported Browsers](#unsupported-browsers)
- :fa-angle-right: [Clean Testing Environment](#clean-testing-environment)
  - [Cypress Profile](#cypress-profile)
  - [Testing Barriers](#removing-testing-barriers)
  - [Tabbed Browsing](#tabbed-browsing)
- :fa-angle-right: [Automation API's](#automation-apis)
  - [Cypress Extension](#cypress-extension)
  - [Browser Drivers](#browser-drivers)
  - [No Selenium Server](#no-selenium-server)

***

# Managing Browsers

When you're ready to start testing, Cypress launches the browser for you. It does this for two main reasons:

1. To create a clean, pristine testing environment.
2. To access the exclusive browser API's for automation.

***

# Launching Browsers

When Cypress is initially [run from the Desktop application](https://on.cypress.io/guides/installing-and-running#running-tests-from-the-gui), you can choose to run Cypress in a select number of browsers including:

- Chrome
- Chromium
- Canary

![open browsers](https://cloud.githubusercontent.com/assets/1268976/15519992/11fa3c36-21d2-11e6-9557-9b0f4139ac70.gif)

We'll automatically detect available browsers based on your OS. In `Linux` we detect browsers by their executable binary, and in `OSX` we'll automatically find them even if they aren't in your `/Applications` folder.

[block:callout]
{
  "type": "warning",
  "body": "I'm confused which is the Cypress browser and which is my own browser!"
}
[/block]

You might notice that if you already have the browser open you will see two icons of the same browser in your Dock.

![switching browsers](https://cloud.githubusercontent.com/assets/1268976/15520492/b812cfe6-21d4-11e6-8764-831f33bd0acf.gif)

We understand that when Cypress is running in its own profile it can be confusing telling the difference from your normal browser and Cypress. For this reason we recommend [downloading Chromium](https://download-chromium.appspot.com/) or [downloading Canary](https://www.google.com/chrome/browser/canary.html). These browsers both have different icons from the standard Chrome browser and it'll be much easier to tell the difference.

![switch canary](https://cloud.githubusercontent.com/assets/1268976/15520491/b812bfe2-21d4-11e6-99ea-c77dae947b26.gif)

Additionally, we've made the browsers spawned by Cypress look different than regular sessions. You'll see a darker theme around the chrome of the browser. You'll always be able to visually distinguish these.

![screen shot 2016-05-24 at 5 25 19 pm](https://cloud.githubusercontent.com/assets/1268976/15520464/936b3976-21d4-11e6-8aca-33d05f2c2a8b.png)

***

## Unsupported Browsers

![screen shot 2016-05-24 at 5 29 05 pm](https://cloud.githubusercontent.com/assets/1268976/15520572/12b158a0-21d5-11e6-92e0-2e75e42fa517.png)

***

# Clean Testing Environment

When we launch browsers we open them in a way that makes testing more reliable and accessible. We do this in three ways:

1. Creating an isolated testing profile
2. Disabling virtually everything that gets in the way of testing
3. Enabling access to browser automation API's

***

## Cypress Profile

Cypress generates its own isolated profile away from your regular browsing profile. This means things like `history` entries, `cookies`, and `3rd party extensions` from your regular browsing session will not affect Cypress.

[block:callout]
{
  "type": "warning",
  "body": "Wait, I need my developer extensions such as React Dev Tools, Batarang, or Ember Inspector!"
}
[/block]

That's no problem - you simply have to reinstall them **once**. We'll continue to use this Cypress testing profile on subsequent launches so all of your configuration will automatically be preserved.

***

## Testing Barriers

Cypress automatically disables certain functionality in your browser which can get in the way of automated testing.

For instance we will automatically:

- Ignore certificate errors
- Allow blocked pop-ups
- Disable 'Saving passwords'
- Disable 'Autofill forms and passwords'
- Disable asking to become your primary browser
- Disable language translations
- Disable restoring sessions
- Disable a ton of background network traffic
- Disable background and renderer throttling

***

## Tabbed Browsing

***

# Automation API's

## Cypress Extension
<talk about not using the debugger protocol>

***

## Browser Drivers

***

## No Selenium Server

