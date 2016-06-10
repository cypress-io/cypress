slug: each
excerpt: Interate over an array-like structure

The .each() can be used on any array-like structure (arrays and objects with a `length` property). Each time the callback function runs, it is passed the current iteratee, beginning from 0. The iteratee is invoked with three arguments: value, index, and collection. You can stop the loop from within the callback function by returning `false`.

| | |
|--- | --- |
| **Returns** | the original array subject given to `cy.each()` |
| **Timeout** | `cy.each` will retry for the duration of the [`commandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.each( *fn* )](#section-usage)

Iterate over an array-like structure.

***

# Usage

## Iterate over an array of DOM elements

```javascript
cy
  .get("ul>li")
  .each(function($el, index, $list){
    // $el is wrapped jquery element
    if ($el.someMethod() === "something") {
      cy.wrap($el).click()
    } else {
      // do something else
    }
  })
```

***

# Errors

**cy.each() must be passed a callback function as its only argument.**

This error occurs when the argument passed to `cy.each()` is not a function.

**cy.each() can only operate on an array like subject.**

This error occurs when the subject passed to `cy.each()` does not have a `length` property. Ensure the subject passed to `cy.each()` is an array-like structure.

***

# Related

- [spread](https://on.cypress.io/api/spread)
- [eq](https://on.cypress.io/api/eq)