excerpt: Instantiate a bluebird promise
slug: promise

Cypress automatically proxies [`Bluebird`](https://github.com/petkaantonov/bluebird) and exposes it as `cy.Promise`.

### [new cy.Promise( *function* )](#usage)

Instantiate a new bluebird promise.

***

## Usage

Use `cy.Promise` to create promises. Cypress is promise aware so if you return a promise from inside of commands like `cy.then`, Cypress will not continue until those promises resolve.

```javascript
cy.get("button").then(function($button){
  new cy.Promise(function(resolve, reject){
    // do something custom here
  })
})
```