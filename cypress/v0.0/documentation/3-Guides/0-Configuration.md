slug: configuration
excerpt: Configure global, network, folder, viewport, and animation options

# Contents

- :fa-angle-right: [Configuration Options](#section-configuration-options)
  - [Global](#section-global)
  - [Network](#section-network)
  - [Folders](#section-folders)
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
`port` | `2020` | Port to use for Cypress
`env` | `{}` | [Environment Variables](https://on.cypress.io/guides/environment-variables)
`commandTimeout` | `4000` | Time, in milliseconds, to wait until commands are considered timed out
`watchForFileChanges` | `true` | Whether Cypress will watch and restart tests on file changes
`reporter` | `spec` | The [Mocha reporter](https://mochajs.org/#reporters) used during headless or CI runs
`execTimeout` | `60000` | Time, in milliseconds, to wait for a system command to finish executing during [`cy.exec`](https://on.cypress.io/api/exec) command
`numTestsKeptInMemory` | `50` | The number of test's snapshots and command data that is kept in memory while tests are running

## Network

Option | Default | Description
----- | ---- | ----
`baseUrl` | `null` | Base url to prefix to [`cy.visit`](https://on.cypress.io/api/visit) or [`cy.request`](https://on.cypress.io/api/request) command
`pageLoadTimeout` | `30000` | Time, in milliseconds, to wait until [`cy.visit`](https://on.cypress.io/api/visit), [`cy.go`](https://on.cypress.io/api/go), [`cy.reload`](https://on.cypress.io/api/reload), or a page load times out
`requestTimeout` | `5000` | Time, in milliseconds, to wait for an XHR request during [`cy.wait`](wait) command
`responseTimeout` | `20000` | Time, in milliseconds, to wait until a response for [`cy.request`](request) and [`cy.wait`](https://on.cypress.io/api/wait) commands

## Folders

To turn off the use of `fixture` folders or `support` folders, pass `false` into the respective configuration option.

Option | Default | Description
----- | ---- | ----
`fixturesFolder`    | `cypress/fixtures`    | Where Cypress will look for fixture files
`integrationFolder` | `cypress/integration` | Where Cypress will look for integration test files
`supportFolder`     | `cypress/support`     | Where Cypress will auto load support files

## Web Server

Option | Default | Description
----- | ---- | ----
`fileServerFolder`    | root project folder    | Where Cypress will attempt to serve your application files

## Viewport

Option | Default | Description
----- | ---- | ----
`viewportWidth` | `1000` | Default width in pixels for [`cy.viewport`](https://on.cypress.io/api/viewport)
`viewportHeight` | `660` | Default hidth in pixels for  [`cy.viewport`](https://on.cypress.io/api/viewport)

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
## you can pass --config to cypress open, cypress run, or cypress ci
cypress open --config watchForFileChanges=false,waitForAnimations=false

cypress run --config integrationFolder=tests,fixturesFolder=false,supportFolder=false

cypress ci --config viewportWidth=1280,viewportHeight=720
```

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
export CYPRESS_pageLoadTimeout=10000
export CYPRESS_PAGE_LOAD_TIMEOUT=10000
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

![Resolved Configuration](https://cloud.githubusercontent.com/assets/1268976/14413649/6e1b7ac6-ff4e-11e5-9407-48b1f2d3f02c.png)
