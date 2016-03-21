slug: cypress-promise
excerpt: Instantiate a bluebird promise

# [new Cypress.Promise( *function* )](#usage)

Cypress automatically proxies [`Bluebird`](https://github.com/petkaantonov/bluebird) and exposes it as `Cypress.Promise`.

Instantiate a new bluebird promise.

***

# Usage

Use `Cypress.Promise` to create promises. Cypress is promise aware so if you return a promise from inside of commands like [`cy.then`](https://on.cypress.io/api/then), Cypress will not continue until those promises resolve.

```javascript
cy.get("button").then(function($button){
  new Cypress.Promise(function(resolve, reject){
    // do something custom here
  })
})
```