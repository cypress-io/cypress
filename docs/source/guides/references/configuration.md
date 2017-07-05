---
title: Configuration
comments: false
---

When a project is added to Cypress, a `cypress.json` file is created in the project. This file is used to store the `projectId` ({% url 'after configuring your tests to record' projects-dashboard#Set-up-a-Project-to-Record %}) and any configuration values you supply.

```json
{
  "projectId": "jd90q7"
}
```

# Options

The default behavior of Cypress can be modified by supplying any of the following configuration options. Below is a list of available options and their default values.

## Global

Option | Default | Description
----- | ---- | ----
`baseUrl` | `null` | Url used as prefix for {% url `cy.visit()` visit %} or {% url `cy.request()` request %} command's url
`env` | `{}` | Any values to be set as {% url 'environment variables' environment-variables %}
`ignoreTestFiles` | `*.hot-update.js` | A String or Array of glob patterns used to ignore test files that would otherwise be shown in your list of tests. Cypress uses `minimatch` with the options: `{dot: true, matchBase: true}`. We suggest using {% url "http://globtester.com" http://globtester.com %} to test what files would match.
`numTestsKeptInMemory` | `50` | The number of tests for which snapshots and command data are kept in memory. Reduce this number if you are experiencing high memory consumption in your browser during a test run.
`port` | `null` | Port used to host Cypress. Normally this is a randomly generated port
`reporter` | `spec` | The {% url 'reporter' reporters %} used when running headlessly or in CI
`reporterOptions` | `null` | The {% url 'reporter options' reporters#Options %} used. Supported options depend on the reporter.
`screenshotOnHeadlessFailure` | `true` | Whether to take a screenshot on test failure when running headlessly or in CI
`watchForFileChanges` | `true` | Whether Cypress will watch and restart tests on test file changes

## Timeouts

{% note success Core Concept %}
{% url 'Timeouts are a core concept' introduction-to-cypress#Default-Values %} you should understand well. The default values listed here are meaningful.
{% endnote %}

Option | Default | Description
----- | ---- | ----
`defaultCommandTimeout` | `4000` | Time, in milliseconds, to wait until most DOM based commands are considered timed out
`execTimeout` | `60000` | Time, in milliseconds, to wait for a system command to finish executing during a {% url `cy.exec()` exec %} command
`pageLoadTimeout` | `60000` | Time, in milliseconds, to wait for `page transition events` or {% url `cy.visit()` visit %}, {% url `cy.go()` go %}, {% url `cy.reload()` reload %} commands to fire their page `load` events
`requestTimeout` | `5000` | Time, in milliseconds, to wait for an XHR request to go out in a {% url `cy.wait()` wait %} command
`responseTimeout` | `30000` | Time, in milliseconds, to wait until a response in a {% url `cy.request()` request %}, {% url `cy.wait()` wait %}, {% url `cy.fixture()` fixture %}, {% url `cy.getCookie()` getcookie %}, {% url `cy.getCookies()` getcookies %}, {% url `cy.setCookie()` setcookie %}, {% url `cy.clearCookie()` clearcookie %}, {% url `cy.clearCookies()` clearcookies %}, and {% url `cy.screenshot()` screenshot %} commands

## Folders

Option | Default | Description
----- | ---- | ----
`fileServerFolder`    | root project folder    |Path to folder where application files will attempt to be served from
`fixturesFolder`    | `cypress/fixtures`    | Path to folder containing fixture files (Pass `false` to disable)
`integrationFolder` | `cypress/integration` | Path to folder containing integration test files
`screenshotsFolder`     | `cypress/screenshots`     | Path to folder where screenshots will be saved from {% url `cy.screenshot()` screenshot %} command or after a headless or CI run's test failure
`supportFile` | `cypress/support` | Path to file to load before test files load. This file is compiled and bundled. (Pass `false` to disable)
`videosFolder`     | `cypress/videos`     | Path to folder where videos will be saved after a headless or CI run

## Screenshots

Option | Default | Description
----- | ---- | ----
`screenshotOnHeadlessFailure` | `true` | Whether Cypress will automatically take a screenshot when a test fails when running tests headlessly or in CI.
`screenshotsFolder`     | `cypress/screenshots`     | Path to folder where screenshots will be saved from {% url `cy.screenshot()` screenshot %} command or after a headless run's test failure
`trashAssetsBeforeHeadlessRuns` | `true` | Whether Cypress will trash assets within the `screenshotsFolder` and `videosFolder` before headless test runs.

## Videos

Option | Default | Description
----- | ---- | ----
`trashAssetsBeforeHeadlessRuns` | `true` | Whether Cypress will trash assets within the `screenshotsFolder` and `videosFolder` before headless or CI test runs.
`videoCompression` | `32` | The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be `false` to disable compression or a value between `0` and `51`, where a lower value results in better quality (at the expense of a higher file size).
`videosFolder`     | `cypress/videos`     | Where Cypress will automatically save the video of the test run when running headlessly.
`videoRecording`     | `true`     | Whether Cypress will record a video of the test run when running headlessly.

## Browser

Option | Default | Description
----- | ---- | ----
`chromeWebSecurity`    | `true`    | Whether Chrome Web Security for `same-origin policy` and `insecure mixed content` is enabled. {% url 'Read more about this here' web-security %}

## Viewport

Option | Default | Description
----- | ---- | ----
`viewportHeight` | `660` | Default height in pixels for the application under tests' viewport (Override with {% url `cy.viewport()` viewport %} command)
`viewportWidth` | `1000` | Default width in pixels for the application under tests' viewport. (Override with {% url `cy.viewport()` viewport %} command)

## Animations

Option | Default | Description
----- | ---- | ----
`animationDistanceThreshold` | `5` | The distance in pixels an element must exceed over time to be considered animating
`waitForAnimations` | `true` | Whether to wait for elements to finish animating before executing commands

# Overriding Options

Besides modifying your `cypress.json` you can also change configuration options through the *command line* or from your system *{% url 'environment variables' environment-variables %}*.

## Command Line

When {% url 'running Cypress from the Command Line' command-line %} you can pass a `--config` flag.

**Examples:**

```shell
cypress open --config watchForFileChanges=false,waitForAnimations=false
```

```shell
cypress run --config integrationFolder=tests,fixturesFolder=false
```

```shell
cypress run --record --config viewportWidth=1280,viewportHeight=720
```

## Environment Variables

You can also use {% url 'environment variables' environment-variables %} to override configuration values. This is especially useful in {% url 'Continuous Integration' continuous-integration %} or when working locally. This gives you the ability to change configuration options without modifying any code or build scripts.

By default, any environment variable that matches a corresponding configuration key will override the `cypress.json` value.

```shell
export CYPRESS_VIEWPORT_WIDTH=800
export CYPRESS_VIEWPORT_HEIGHT=600
```

We automatically normalize both the key and the value. Cypress will *strip off* the `CYPRESS_`, camelcase any keys and automatically convert values into `Number` or `Boolean`. Make sure to prefix your environment variables with `CYPRESS_` else they will be ignored.

**Both options below are valid**

```shell
export CYPRESS_pageLoadTimeout=100000
export CYPRESS_PAGE_LOAD_TIMEOUT=100000
```

{% note warning  %}
Environment variables that do not match configuration keys will instead be set as regular environment variables for use in your tests with `Cypress.env()`.

You can {% url 'read more about Environment Variables' environment-variables %}.
{% endnote %}

## `Cypress.config()`

You can also override configuration values within your test using {% url `Cypress.config()` config %}.
Any value you change will be permanently changed for the remainder of your tests.

```javascript
Cypress.config("pageLoadTimeout", 100000)

Cypress.config("pageLoadTimeout") // => 100000
```

# Resolved Configuration

When you open a Cypress project, clicking on the *Settings* tab will display the resolved configuration to you. This makes it easy to understand and see where different values came from.

![resolve-configuration](https://user-images.githubusercontent.com/1271364/26941279-e7903108-4c4b-11e7-8731-be118e2c30eb.jpg)
