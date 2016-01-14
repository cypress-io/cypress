excerpt: Configure Cypress
slug: global-configuration

Every project has a `cypress.json` file with configuration options including:

Option | Default | Notes
----- | ---- | ----
baseUrl | null | Prefixes [`cy.visit`](http://on.cypress.io/api/visit) with a base url.
commandTimeout | 4000 | Time to wait until normal commands time out
visitTimeout | 30000 | Time to wait until [`cy.visit`](http://on.cypress.io/api/visit) times out
requestTimeout | 5000 | Time to wait for an XHR request for [`cy.wait`](wait)
responseTimeout | 20000 | Time to wait until a response for [`cy.request`](request) and [`cy.wait`](http://on.cypress.io/api/wait)
testFolder | `/tests` | Where Cypress will look for test files
fixturesFolder | `/tests/_fixtures` | Where Cypress will look for fixture files
supportFolder | `/tests/_support` | Where Cypress will auto load support files
viewportWidth | 1000 | Initial width in pixels for [`cy.viewport`](http://on.cypress.io/api/viewport)
viewportHeight | 660 | Initial hidth in pixels for  [`cy.viewport`](http://on.cypress.io/api/viewport)
waitForAnimations | true | Whether to wait for elements to finish animating before applying actions
animationDistanceThreshold | 5 | The distance in pixels an element must exceed to be considered animating
port | 2020 | Port to run Cypress on
env | `{}` | [Environment Variables](http://on.cypress.io/guides/environment-variables)