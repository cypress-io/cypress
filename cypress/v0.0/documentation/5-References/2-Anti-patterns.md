slug: anti-patterns
excerpt: Patterns that are ineffective and risk being counterproductive

# Contents

- :fa-angle-right: [Forcing arbitrary waits](#section-forcing-arbitrary-waits)

# Forcing arbitrary waits

One of the main goals of Cypress is to eliminate the need to littering your tests with arbitrary waits. Commands in Cypress are retried until they meet the passing condition or until they timeout. All timeout for commands are also configurable.

```javascript
cy
  .request("http://localhost:8080/db/seed")
  .wait(5000)     // <--- this is unnecessary
  .visit("http://localhost/8080")
  .wait(5000)     // <--- this is unnecessary
  .server()
  .route("GET", /users/, ["id": 1, "name": "Margeret"])
  .wait(4000)     // <--- this is unnecessary
```

The test commands above will run much slower and furthermore, the [`cy.wait`](https://on.cypress.io/api/wait) commands are unnecessary.

Lets walk through what the commands do by default in the example above:

- [`cy.request`](https://on.cypress.io/api/request) will resolve when the `GET` to the URL is successful *or* the test case will fail when the command timeouts (the default timeout for request is `20000`)
- [`cy.visit`](https://on.cypress.io/api/visit) will resolve when the page's `load` event fires *or* the test case will fail when the command timeouts (the default timeout for [`cy.visit`](https://on.cypress.io/api/visit) is `20000`)
- [`cy.route`]() will resolve when the request's response returns 200 (or the specified status code) or when the request timeouts (the default [`requestTimeout`](https://on.cypress.io/guides/configuration#section-network-options) is `500`) or when the response timeouts (the default [`responseTimeout`](https://on.cypress.io/guides/configuration#section-network-options) is ``).