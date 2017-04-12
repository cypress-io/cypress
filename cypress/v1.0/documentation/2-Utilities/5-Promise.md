slug: cypress-promise
excerpt: Instantiate a bluebird promise

# [new Cypress.Promise( *function* )](#usage)

Cypress automatically proxies [`Bluebird`](https://github.com/petkaantonov/bluebird) and exposes it as `Cypress.Promise`.

Instantiate a new bluebird promise.

***

# Usage

Use `Cypress.Promise` to create promises. Cypress is promise aware so if you return a promise from inside of commands like [`cy.then`](https://on.cypress.io/api/then), Cypress will not continue until those promises resolve.

## Basic Promise

```javascript
cy.get("button").then(function($button){
  return new Cypress.Promise(function(resolve, reject){
    // do something custom here
  })
})
```

***

## Waiting for Promises

```javascript
it("waits for promises to resolve", function(){
  var waited = false

  function waitOneSecond(){
    // return a promise that resolves after 1 second
    return new Cypress.Promise(function(resolve, reject){
      setTimeout(function(){
        // set waited to true
        waited = true

        // resolve with 'foo' string
        resolve('foo')
      }, 1000)
    })
  }

  cy
    .then(function(){
      // return a promise to cy.then() that
      // is awaited until it resolves
      return waitOneSecond().then(function(str){
        expect(str).to.eq('foo')
        expect(waited).to.be.true
      })
    })
})
```
