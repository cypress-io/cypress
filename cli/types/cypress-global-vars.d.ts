// `cy` and `Cypress` are declared with `var` in an ambient global script file so
// they land on `typeof globalThis` — `let`/`const` would drop `window.Cypress` and
// `globalThis.cy` from the published types. Both are also reassigned at runtime
// (the driver sets `window.Cypress` and `window.cy`), so neither is a constant.

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
