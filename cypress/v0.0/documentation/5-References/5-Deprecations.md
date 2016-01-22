slug: deprecations
excerpt: Deprecations that require additional explanation will be listed here.

# Contents

- :fa-angle-right: [Passing cy.server({stub: false}) is now deprecated](#section-passing-cy-server-stub-false-is-now-deprecated)
- :fa-angle-right: [Passing cy.route({stub: false}) is now deprecated](#section-passing-cy-route-stub-false-is-now-deprecated)

***

# Passing `cy.server({stub: false})` is now deprecated

In previous versions of Cypress, to prevent Cypress from stubbing routes you had to explicitly tell your server not to stub routes like this:

```javascript
cy
  .server({stub: false})
  .route(...)
```

You no longer have to do this. Whether a [cy.route](https://on.cypress.io/api/route) is stubbed or not is simply based on whether or not you specified a response in [cy.route](https://on.cypress.io/api/route).

***

# Passing `cy.route({stub: false})` is now deprecated

In previous versions of Cypress, [cy.route](https://on.cypress.io/api/route) would require a `response` unless you specified `stub: false` in its options.

You used to have to write this:

```javascript
cy
  .server()
  .route({url: /posts/, stub: false})
```

This is now deprecated because Cypress automatically stubs [cy.route](https://on.cypress.io/api/route) based on whether or not it has a `response` property.

```javascript
cy
  .server()
  .route(/users/, [{}, {}])               // <-- stubbed because this has a response argument
  .route({url: /comments/, response: []}) // <-- stubbed because this has a response property
  .route(/posts/)                         // <-- not stubbed because there is no response argument or property
```
