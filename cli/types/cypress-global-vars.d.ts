// Only `var` lands on `typeof globalThis` in an ambient global declaration, which
// is what keeps `cy` and `Cypress` reachable on `window` and `globalThis`. The
// driver reassigns both at runtime.

/**
 * Global variables `cy` added by Cypress with all API commands.
 * @see https://on.cypress.io/api
 *
```
cy.get('button').click()
cy.get('.result').contains('Expected text')
```
 */
// eslint-disable-next-line no-var
declare var cy: Cypress.cy & CyEventEmitter

/**
 * Global variable `Cypress` holds common utilities and constants.
 * @see https://on.cypress.io/api
 *
```
Cypress.config("pageLoadTimeout") // => 60000
Cypress.version // => "1.4.0"
Cypress._ // => Lodash _
```
 */
// eslint-disable-next-line no-var
declare var Cypress: Cypress.Cypress & CyEventEmitter
