slug: spread
excerpt: Spread an array as individual arguments to a callback function

### [cy.spead()](#usage)

The spread command allows an expression to be expanded in places where multiple arguments are expected. Similar to [`cy.then`](http://on.cypress.io/api/then)

***

## Usage

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

## Related
1. [then](http://on.cypress.io/api/then)
2. [wait](http://on.cypress.io/api/wait)