slug: cypress-and-the-browser
excerpt: How and why Cypress manages the browser session while running tests

# Contents

- :fa-angle-right: [How Cypress Manages the Browser Session](#section-how-cypress-manages-the-browser-session)
- :fa-angle-right: [Why Cypress Manages the Browser Session](#section-why-cypress-manages-the-browser-session)
  - [Validation](#section-validation)
  - [Formatting](#section-formatting)

***

# How Cypress Manages the Browser Session

When Cypress is initially [run from the Desktop application](https://on.cypress.io/guides/installing-and-running#section-logging-in), you can choose to run Cypress in a select number of browsers including:

- Chrome
- Chromium
- Canary

**Note: We only list the latest version of the above browsers currently installed on your system. We intend to expand support for more browsers in the future. **

When Cypress is run in one of the available browsers, your tests open in a new browser window with a clean browser session. This browser session has a Cypress extension installed on it. This extension takes advantage of the [Chrome extension API](https://developer.chrome.com/extensions/api_index) in order to expand the Cypress API and help maintain an isolated environment to run automated tests.

# Why Cypress Manages Browser Session

## Extending the Cypress API

There are many browser behaviors that Cypress needs more fine grained control over in order to maintain a balance between speed and driving your integration tests. Some ways Cypress utilizes the new browser session and the Chrome extension API are:

**Ignoring certificate errors**

Occasionally you will get an error message telling you there's a problem with the website's security certificate that you're testing. We can disable this certificate error since this is probably not a concern in your testing environment.

**Allowing blocked pop-ups**

If the application you're testing utilizes pop-ups, the browser will block the pop-up by default. By allowing pop-ups, Cypress can more closely replicate the desired behavior of your app.

**Disabling 'Save passwords'**

Being prompted to save a password or having a password input pre-filled from saved passwords is undesired behavior when testing your application.

**Disabling throttling during rendering**

**Disabling background throttling**

**Disabling extensions**

Many extensions can cause behavior that is unwanted when running integration tests. One example is having a password extension prompt to fill in a password input when testing a form in your app. Since we're starting a brand new browser session in Cypress, none of your extensions will be installed.

## Isolating the Test Environment

There are also many benefits to our browser session strategy in terms of maintaining an isolated test environment. Some examples are:

**Encouraging only one tab to be open**

When multiple tabs are open and one tab is **backgrounded**, Chrome will automatically throttle back `setTimeouts` from `.004s` to `1s`. This decreases the performance of Cypress tests running in a backgrounded tab by **250x**.

Working in other tabs while testing Cypress also has the possibility of leaking shared state to your Cypress tests (like sessionStorage).

Because of this, we encourage having Cypress as the sole tab in the browser and display a message explaining this whenever a new tab is opened.

**Disabling 'restore last session'**

**Maintaining a clean history**

**Clearing any browser profiles**

**Clearing cookies in between tests**

