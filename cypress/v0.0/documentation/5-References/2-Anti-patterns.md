slug: anti-patterns
excerpt: Patterns which you should avoid

# Contents

- :fa-angle-right: [Adding unncessary waits](#adding-unnecessary-waits)

***

# Adding unncessary waits

In Cypress, you almost **never** need to `cy.wait` for an arbitrary period of time. If you are finding yourself do this, there is likely a much better, simpler way.

Let's imagine the following example:

```javascript
cy
  .request("http://localhost:8080/db/seed")
  .wait(5000)     // <--- this is unnecessary
  .visit("http://localhost/8080")
  .wait(5000)     // <--- this is unnecessary
  .server()
  .route("GET", /users/, [{"name": "Maggy"}, {"name": "Joan"}])
  .get("#fetch").click()
  .wait(4000)     // <--- this is unnecessary
  .get("table tr").should("have.length", 2)
```

Each arbitrary wait is unnecessary in the example above.

1. [`cy.request`](https://on.cypress.io/api/request) - waiting for this is unnecessary because this command will not resolve **until** it receives a response from your server. Adding the wait here only adds **5 seconds** after the `cy.request` has *already* resolved.
2. [`cy.visit`](https://on.cypress.io/api/visit) - waiting for this is unnecessary because this command will resolve once the page fires its `load` event. By that time all of your assets have been loaded including `javascript`, `stylesheets`, and `html`.
3. [`cy.get`](https://on.cypress.io/api/route) - waiting for the `cy.get` is unncessary because `cy.get` will automatically continue to retry until the `table tr` has a length of 2. Whenever commands have an assertion they will not resolve until their associated assertions pass. This enables you to simply describe the **state** of your application without having to worry about *when* it gets there. Alternatively a better solution to this problem is by waiting explictly for an aliased route.

The following is the least brittle way of writing the following:

```javascript
cy
  .request("http://localhost:8080/db/seed")
  .visit("http://localhost/8080")
  .server()
  .route("GET", /users/, [{"name": "Maggy"}, {"name": "Joan"}]).as("getUsers")
  .get("#fetch").click()
  .wait("@getUsers")     // <--- wait explicitly for this route to finish
  .get("table tr").should("have.length", 2)
```

By waiting for the `getUsers` route, Cypress is smart enough to not only wait for a request to go out, but also for a response to come back in.
