slug: configuration
excerpt: Configure global, network, folder, viewport, and animation options

# Contents

- :fa-angle-right: [Global Options](#section-global-options)
- :fa-angle-right: [Network Options](#section-network-options)
- :fa-angle-right: [Folder Options](#section-folder-options)
- :fa-angle-right: [Web Server Options](#section-web-server-options)
- :fa-angle-right: [Viewport Options](#section-viewport-options)
- :fa-angle-right: [Animation Options](#section-animation-options)

***

When a project is added to Cypress, a `cypress.json` file is created in your project. This file contains your `projectId`.

```json
{
  "projectId": "128076ed-9868-4e98-9cef-98dd8b705d75"
}
```

You can modify other options in your `cypress.json`.

# Global Options

Option | Default | Description
----- | ---- | ----
`port` | `2020` | Port to use for Cypress
`env` | `{}` | [Environment Variables](https://on.cypress.io/guides/environment-variables)
`commandTimeout` | `4000` | Time, in milliseconds, to wait until commands are considered timed out

# Network Options

Option | Default | Description
----- | ---- | ----
`baseUrl` | `null` | Base url to prefix to [`cy.visit`](https://on.cypress.io/api/visit) or [`cy.request`](https://on.cypress.io/api/request) command
`visitTimeout` | `30000` | Time, in milliseconds, to wait until [`cy.visit`](https://on.cypress.io/api/visit) times out
`requestTimeout` | `5000` | Time, in milliseconds, to wait for an XHR request during [`cy.wait`](wait) command
`responseTimeout` | `20000` | Time, in milliseconds, to wait until a response for [`cy.request`](request) and [`cy.wait`](https://on.cypress.io/api/wait) commands

# Folder Options

To turn off the use of `fixture` folders or `support` folders, pass `false` into the respective configuration option.

Option | Default | Description
----- | ---- | ----
`fixturesFolder`    | `/cypress/fixtures`    | Where Cypress will look for fixture files
`integrationFolder` | `/cypress/integration` | Where Cypress will look for integration test files
`supportFolder`     | `/cypress/support`     | Where Cypress will auto load support files

# Web Server Options

Option | Default | Description
----- | ---- | ----
`fileServerFolder`    | root project folder    | Where Cypress will attempt to serve your application files

# Viewport Options

Option | Default | Description
----- | ---- | ----
`viewportWidth` | `1000` | Default width in pixels for [`cy.viewport`](https://on.cypress.io/api/viewport)
`viewportHeight` | `660` | Default hidth in pixels for  [`cy.viewport`](https://on.cypress.io/api/viewport)

# Animation Options

Option | Default | Description
----- | ---- | ----
`waitForAnimations` | `true` | Whether to wait for elements to finish animating before applying commands
`animationDistanceThreshold` | `5` | The distance in pixels an element must exceed to be considered animating
