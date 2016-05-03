slug: cypress-and-the-browser
excerpt: How and why Cypress manages the browser session while running tests

# Contents

- :fa-angle-right: [How Cypress Manages the Browser Session](#section-how-cypress-manages-the-browser-session)
- :fa-angle-right: [Why Cypress Manages the Browser Session](#section-why-cypress-manages-the-browser-session)
  - [Validation](#section-validation)
  - [Formatting](#section-formatting)

***

# How Cypress Manages the Browser Session

When Cypress is initially run from the Desktop application, you can choose to run Cypress in a select number of browsers including:

- Chrome
- Chromium
- Canary

We intend to expand support for more browsers in the future. When Cypress is run on one of the available browsers, your tests are opened in a new browser window with a clean browser session. This browser session has a Cypress extension installed on it. This extension takes advantage of the Chrome extension API in order to expand the Cypress API and help maintain an isolated environment to run integration tests.

# Why Cypress Manages Browser Session

Why Cypress opens in a new browser session with a special extension requires a much more involved response.

## Extending the Cypress API

There are many browser behaviors that Cypress needs more fine grained control over in order to maintain a balance between speed and mimicking user behavior. Some ways Cypress utilizes a new browser session and the Chrome extension API to maintain this balance are:

**Ignoring certificate errors**

**Allowing blocked pop-ups**

When your application utilizes pop-ups, the browser will block the pop-up by default. By allowing pop-ups, this more closely mimics the desired behavior of your app.

**Disabling 'Save passwords'**

Being prompted to save a password or having a password input pre-filled from saved passwords is undesired behavior when testing your application.

**Disabling throttling during rendering**

**Disabling background throttling**

**Disabling extensions**

Many extensions can cause behavior that is unwanted when running your integration tests. One example is a password extension prompting to fill in a password input when testing a form in your app.

## Isolating the Test Environment

There are also many benefits to our browser session strategy in terms of maintaining an isolated test environment. Some examples are:

**Disabling 'restore last session'**

**Encouraging only one tab to be open**

**Maintaining a clean history**

**Clearing any browser profiles**

**Clearing cookies in between tests**

