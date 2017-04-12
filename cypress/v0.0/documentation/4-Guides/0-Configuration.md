slug: configuration
excerpt: Configure global, network, folder, viewport, and animation options

# Contents

- :fa-angle-right: [Configuration Options](#section-configuration-options)
  - [Global](#section-global)
  - [Timeouts](#section-timeouts)
  - [Folders](#section-folders)
  - [Screenshots](#section-screenshots)
  - [Videos](#section-videos)
  - [Browser](#section-browser)
  - [Web Server](#section-web-server)
  - [Viewport](#section-viewport)
  - [Animation](#section-animation)
- :fa-angle-right: [Overriding Options](#section-overriding-options)
  - [Command Line](#section-command-line)
  - [Environment Variables](#section-environment-variables)
- :fa-angle-right: [Resolved Configuration](#section-resolved-configuration)

***

# Configuration Options

When a project is added to Cypress, a `cypress.json` file is created in your project. This file contains your `projectId` and any configuration values you supply.

```json
{
  "projectId": "128076ed-9868-4e98-9cef-98dd8b705d75"
}
```

By modifying the following values you can change the default behavior of Cypress.

Here is a list of available options and their default values.

## Global

Option | Default | Description
----- | ---- | ----
`baseUrl` | `null` | Base url to prefix to [`cy.visit`](https://on.cypress.io/api/visit) or [`cy.request`](https://on.cypress.io/api/request) command
`env` | `{}` | [Environment Variables](https://on.cypress.io/guides/environment-variables)
`ignoreTestFiles` | `*.hot-update.js` | A string or array of glob patterns for ignoring test files that would otherwise be shown in your tests list. Under the hood Cypress is using `minimatch` with the options: `{dot: true, matchBase: true}`. We suggest you using [http://globtester.com](http://globtester.com) to test what files would match.
`port` |  | Port to use for Cypress
`numTestsKeptInMemory` | `50` | The number of tests for which snapshots and command data are kept in memory. Reduce this number if you are seeing extremely high memory consumption in your browser.
`reporter` | `spec` | The [reporter](https://on.cypress.io/guides/reporters) used during headless or CI runs
`reporterOptions` | `null` | The [reporter options](https://on.cypress.io/guides/reporters#section-reporter-options) used. Supported options depend on the reporter.
`screenshotOnHeadlessFailure` | `true` | Whether to take a screenshot automatically on test failure when running headlessly or in CI
`watchForFileChanges` | `true` | Whether Cypress will watch and restart tests on file changes

***

## Timeouts

Option | Default | Description
----- | ---- | ----
`defaultCommandTimeout` | `4000` | Time, in milliseconds, to wait until most DOM based commands are considered timed out
`execTimeout` | `60000` | Time, in milliseconds, to wait for a system command to finish executing during [`cy.exec`](https://on.cypress.io/api/exec) command
`pageLoadTimeout` | `60000` | Time, in milliseconds, to wait until [`cy.visit`](https://on.cypress.io/api/visit), [`cy.go`](https://on.cypress.io/api/go), [`cy.reload`](https://on.cypress.io/api/reload), or a page load times out
`requestTimeout` | `5000` | Time, in milliseconds, to wait for an XHR request during [`cy.wait`](wait) command
`responseTimeout` | `30000` | Time, in milliseconds, to wait until a response for [`cy.request`](https://on.cypress.io/api/request), [`cy.wait`](https://on.cypress.io/api/wait), [`cy.fixture`](https://on.cypress.io/api/fixture), [`cy.getCookie`](https://on.cypress.io/api/getcookie), [`cy.getCookies`](https://on.cypress.io/api/getcookies), [`cy.setCookie`](https://on.cypress.io/api/setcookie), [`cy.clearCookie`](https://on.cypress.io/api/clearcookie) and [`cy.clearCookies`](https://on.cypress.io/api/clearcookies), and [`cy.screenshot`](https://on.cypress.io/api/screenshot) commands

***

## Folders

To turn off the use of `fixture` folders, pass `false` into the configuration option.

Option | Default | Description
----- | ---- | ----
`fixturesFolder`    | `cypress/fixtures`    | Where Cypress will look for fixture files
`integrationFolder` | `cypress/integration` | Where Cypress will look for integration test files
`supportFile` | `cypress/support` | Path to a file to load before your test files. File is compiled and bundled as test files are. Pass `false` to turn off.
`screenshotsFolder`     | `cypress/screenshots`     | Where Cypress will automatically save screenshots from [`cy.screenshot()`](https://on.cypress.io/api/screenshot) or during test failures when running headlessly.
`videosFolder`     | `cypress/videos`     | Where Cypress will automatically save the video of the test run when running headlessly.

***

## Screenshots

Option | Default | Description
----- | ---- | ----
`screenshotsFolder`     | `cypress/screenshots`     | Where Cypress will automatically save screenshots from [`cy.screenshot()`](https://on.cypress.io/api/screenshot) or during test failures when running headlessly.
`screenshotOnHeadlessFailure` | `true` | Whether Cypress will automatically take a screenshot when a test fails when running tests headlessly or in CI.
`trashAssetsBeforeHeadlessRuns` | `true` | Whether Cypress will trash assets within the `screenshotsFolder` and `videosFolder` before headless test runs.

***

## Videos

Option | Default | Description
----- | ---- | ----
`videoRecording`     | `true`     | Whether Cypress will record a video of the test run when running headlessly.
`videoCompression` | `32` | The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be `false` to disable compression or a value between `0` and `51`, where a lower value results in better quality (at the expense of a higher file size).
`videosFolder`     | `cypress/videos`     | Where Cypress will automatically save the video of the test run when running headlessly.
`trashAssetsBeforeHeadlessRuns` | `true` | Whether Cypress will trash assets within the `screenshotsFolder` and `videosFolder` before headless test runs.

***

## Browser

Option | Default | Description
----- | ---- | ----
`chromeWebSecurity`    | true    | Whether Chome Web Security for `same-origin policy` and `insecure mixed content` is enabled. [Read more about this here.](https://on.cypress.io/guides/web-security)

***

## Web Server

Option | Default | Description
----- | ---- | ----
`fileServerFolder`    | root project folder    | Where Cypress will attempt to serve your application files

***

## Viewport

Option | Default | Description
----- | ---- | ----
`viewportWidth` | `1000` | Default width in pixels for [`cy.viewport`](https://on.cypress.io/api/viewport)
`viewportHeight` | `660` | Default height in pixels for  [`cy.viewport`](https://on.cypress.io/api/viewport)

***

## Animations

Option | Default | Description
----- | ---- | ----
`waitForAnimations` | `true` | Whether to wait for elements to finish animating before applying commands
`animationDistanceThreshold` | `5` | The distance in pixels an element must exceed to be considered animating

***

# Overriding Options

Besides modifying your `cypress.json` you can also change configuration options by the **Command Line** or from your system **Environment Variabes**.

## Command Line

When [running Cypress from the Command Line](https://github.com/cypress-io/cypress-cli#cypress-open-1) you can pass the `--config` flag.

Be sure to separate multiple values with a **comma**.

Example:

```shell
## you can pass --config to cypress open or cypress run
cypress open --config watchForFileChanges=false,waitForAnimations=false

cypress run --config integrationFolder=tests,fixturesFolder=false

cypress run --record --config viewportWidth=1280,viewportHeight=720
```

***

## Environment Variables

You can also use environment variables to override configuration values. This is especially useful in CI or when working locally. This gives you the ability to change configuration options without modifying any code or build scripts.

By default, any environment variable that matches a cooresponding configuration key will override its default value.

```shell
## change the viewport width + height with environment variables
export CYPRESS_VIEWPORT_WIDTH=800
export CYPRESS_VIEWPORT_HEIGHT=600
```

We automatically normalize both the key and the value.

Keys are automatically camel cased, and we will automatically convert values into `Number` and `Boolean`.

```shell
## both of these are valid
export CYPRESS_pageLoadTimeout=100000
export CYPRESS_PAGE_LOAD_TIMEOUT=100000
```

[block:callout]
{
  "type": "info",
  "body": "Make sure to prefix your environment variables with **CYPRESS_** else they will be ignored."
}
[/block]

[block:callout]
{
  "type": "warning",
  "body": "Environment variables which do not match configuration keys will instead be set as regular environment variables for use in your tests with `Cypress.env()`.\n\nYou can [read more about Environment Variables](https://on.cypress.io/environment-variables)."
}
[/block]

***

# Resolved Configuration

When you open a Cypress project, we will display the resolved configuration to you.

This makes it easy to understand and see where different values came from.

![Resolved Configuration](https://cloud.githubusercontent.com/assets/1271364/22704601/47c9881e-ed36-11e6-81a0-725778038902.png)
