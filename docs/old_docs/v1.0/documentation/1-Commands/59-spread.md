slug: spread
excerpt: Spread an array as individual arguments to a callback function

The spread command allows an expression to be expanded in places where multiple arguments are expected. Similar to [`cy.then`](https://on.cypress.io/api/then), but always expects an array as it's subject.

| | |
|--- | --- |
| **Returns** | the value of the spread |
| **Timeout** | *cannot timeout* |

***

# [cy.spread( *fn* )](#section-usage)

Expand an array of arguments.

***

# Usage

## Expand the array of aliased routes

```javascript
cy
  .server()
  .route(/users/).as("getUsers")
  .route(/activities/).as("getActivities")
  .route(/comments/).as("getComments")
  .wait(["@getUsers", "@getActivities", "@getComments"])
  .spread(function(getUsers, getActivities, getComments){
    // each XHR is now an individual argument
  })
```

***

# Related

- [then](https://on.cypress.io/api/then)
- [wait](https://on.cypress.io/api/wait)