slug: wait
excerpt: Wait for a specific amount of time or resource to resolve

#### **New to Cypress?** [Read about XHR strategy first.](xhr)

***

### [cy.wait( *number* )](#number-usage)

Wait a specific amount of `ms` before resolving and continuing onto the next command.

***

### [cy.wait( *alias* )](#alias-usage)

Wait until the matching aliased XHR has a response.

***

### [cy.wait( *\[alias1*, *alias2*, *alias3\]* )](#alias-array-usage)

Wait for an array of aliases to have responses.

***

## Number Usage

```javascript
// Wait 500ms before resolving
cy.wait(500)
```

***

## Alias Usage

#### Wait for a specific XHR to finish

```javascript
// Wait for the route aliased as `getAccount` to respond
// without actually changing or stubbing its response
cy
  .server()
  .route(/accounts\/d+/).as("getAccount")
  .visit("/accounts/123")
  .wait("@getAccount").then(function(xhr){
    // we can now access the low level xhr
    // which contains the request body,
    // response body, status, etc
  })
```

#### Wait automatically increments responses

```javascript
// each time we cy.wait() for an alias Cypress will
// wait for the next nth matching request
cy
  .server()
  .route(/books/, []).as("getBooks")
  .get("#books").type("Grendel")

  // wait for the first response to finish
  .wait("@getBooks")

  // the results should be empty because we
  // responded with an empty array first
  .get("#book-results").should("be.empty")

  // now re-route the books endpoint and force it to
  // have a response this time
  .route(/books/, [{name: "Emperor of all maladies"}])

  .get("#books").type("Emperor of")

  // now when we wait for 'getBooks' again Cypress will
  // automatically know to wait for the 2nd response
  .wait("@getBooks")

  // we responded with 1 book item so now we should
  // have one result
  .get("#book-results").should("have.length", 1)
```

***

## Alias Array Usage

You can pass an array of aliases which will be waited on before resolving.

```javascript
cy
  .server()
  .route(/users/).as("getUsers")
  .route(/activities/).as("getActivities")
  .route(/comments/).as("getComments")
  .visit("/dashboard")
  .wait(["@getUsers", "@getActivities", "getComments"])
  .then(function(xhrs){
    // xhrs will now be an array of matching XHR's
    // xhrs[0] <-- getUsers
    // xhrs[1] <-- getActivities
    // xhrs[2] <-- getComments
  })
```

You could also use the [`spread`](spread) command here to spread out this array into multiple arguments.

```javascript
cy
  .server()
  .route(/users/).as("getUsers")
  .route(/activities/).as("getActivities")
  .route(/comments/).as("getComments")
  .wait(["@getUsers", "@getActivities", "getComments"])
  .spread(function(getUsers, getActivities, getComments){
    // each XHR is now an individual argument
  })
```

***

## Notes

#### requestTimeout and responseTimeout

`cy.wait` goes through two separate "waiting" periods for a matching XHR.

The first period waits for a matching request to leave the browser. This duration is configured by [`requestTimeout`](getting-started#configuration) - which is a default of `5000ms`.

What that means is that when you begin waiting for an XHR Cypress will wait up to 5 seconds for a matching XHR to be created. If no matching XHR is found, you will get an error message that looks like this:

![screen shot 2015-12-21 at 5 00 09 pm](https://cloud.githubusercontent.com/assets/1268976/11942578/8e7cba50-a805-11e5-805c-614f8640fbcc.png)

Once Cypress detects that a matching XHR has begun its request it then switches over to the 2nd waiting period. This duration is configured by [`responseTimeout`](getting-started#configuration) - which is a default of `20000ms`.

This means Cypress will now wait up to 20 seconds for the external server to respond to this XHR. If no response is detected you will get an error message that looks like this:

![screen shot 2015-12-21 at 5 06 52 pm](https://cloud.githubusercontent.com/assets/1268976/11942577/8e7196e8-a805-11e5-97b1-8acdde27755d.png)

This gives you the best of both worlds - a fast error feedback loop when requests never go out, and a much longer duration for the actual external response.

***

## Command Log

```javascript
cy
  .server()
  .route("PUT", /users/, {}).as("userPut")
  .get("form").submit()
  .wait("@userPut")
    .its("url").should("include", "users")
```

The commands above will display in the command log as:

<img width="584" alt="screen shot 2015-11-29 at 2 20 53 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459433/7eabc516-96a4-11e5-90c3-19f8e49a0b0c.png">

When clicking on `wait` within the command log, the console outputs the following:

<img width="952" alt="screen shot 2015-11-29 at 2 21 11 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459434/81132966-96a4-11e5-962f-41718b49b142.png">

***

## Related
1. [server](http://on.cypress.io/api/server)
2. [route](http://on.cypress.io/api/route)
3. [as](http://on.cypress.io/api/as)
