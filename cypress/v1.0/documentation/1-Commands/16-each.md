slug: each
excerpt: Interate over an array-like structure

The `cy.each()` will iterate through an array like structure (arrays and objects with a `length` property).

Each time the callback function runs, it is invoked with three arguments: `value`, `index`, and `collection`.

If your callback function returns a `Promise` it will be awaited before iterating over the next element in the collection.

You can stop the loop early by returning `false` in the callback function.

| | |
|--- | --- |
| **Returns** | the original array subject given to `cy.each()` |
| **Timeout** | `cy.each` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.each( *function* )](#usage)

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
      // wrap this element so we can
      // use cypress commands on it
      cy.wrap($el).click()
    } else {
      // do something else
    }
  })
```

***

## Promises are awaited

```javascript
cy
  .wrap([1,2,3])
  .each(function(num, index, array){
    // promises returned are automatically
    // awaited on before calling the next item
    return new Cypress.Promise(function(resolve){
      setTimeout(function(){
        resolve()
      }, num * 100)
    })
  })
```

## The original subject is always returned

```javascript
cy
  .get("li").should("have.length", 3)
  .each(function($li, index, $lis){
    // no matter what we return here
    // the next subject will still
    // be the collection of <li>
    return "something else"
  })
  .then(function($lis){
    expect($lis).to.have.length(3) // true
  })
```

# Errors

## cy.each() can only operate on an array like subject.

This error occurs when the subject passed to `cy.each()` does not have a `length` property. Ensure the subject passed to `cy.each()` is an array-like structure.

***

# Related

- [spread](https://on.cypress.io/api/spread)
- [then](https://on.cypress.io/api/then)
