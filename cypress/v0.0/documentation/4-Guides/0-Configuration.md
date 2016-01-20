slug: configuration
excerpt: Configure global, network, directory, viewport, and animation options

When a project is added to Cypress, a `cypress.json` file is created in your project. This file contains your `projectId`.

```json
{
  "projectId": "128076ed-9868-4e98-9cef-98dd8b705d75"
}
```

You can modify other options in your `cypress.json`.

## Global Options

Option | Default | Description
----- | ---- | ----
`port` | `2020` | Port to use for Cypress
`env` | `{}` | [Environment Variables](http://on.cypress.io/guides/environment-variables)
`commandTimeout` | `4000` | Time (ms) to wait until commands time out

## Network Options

Option | Default | Description
----- | ---- | ----
`baseUrl` | `null` | Base url to prefix to [`cy.visit`](http://on.cypress.io/api/visit) or [`cy.request`](http://on.cypress.io/api/request) command
`visitTimeout` | `30000` | Time (ms) to wait until [`cy.visit`](http://on.cypress.io/api/visit) times out
`requestTimeout` | `5000` | Time (ms) to wait for an XHR request during [`cy.wait`](wait) command
`responseTimeout` | `20000` | Time (ms) to wait until a response for [`cy.request`](request) and [`cy.wait`](http://on.cypress.io/api/wait) commands

## Directory Options

Option | Default | Description
----- | ---- | ----
`testFolder` | `/tests` | Test folder where your test files
`fixturesFolder` | `/tests/_fixtures` | Where Cypress will look for fixture files
`supportFolder` | `/tests/_support` | Where Cypress will auto load support files

## Viewport Options

Option | Default | Description
----- | ---- | ----
`viewportWidth` | `1000` | Default width in pixels for [`cy.viewport`](http://on.cypress.io/api/viewport)
`viewportHeight` | `660` | Default hidth in pixels for  [`cy.viewport`](http://on.cypress.io/api/viewport)

## Animation Options

Option | Default | Description
----- | ---- | ----
`waitForAnimations` | `true` | Whether to wait for elements to finish animating before applying commands
`animationDistanceThreshold` | `5` | The distance in pixels an element must exceed to be considered animating
