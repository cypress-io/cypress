---
title: each
comments: false
---

Iterate through an array like structure (arrays or objects with a `length` property).

# Syntax

```javascript
.each(callbackFn)
```

## Usage

`.each()` requires being chained off another cy command that *yields* an array like structure (arrays or objects with a `length` property).

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('ul>li').each(function(){...}) // Iterate through each 'li'
cy.getCookies().each(function(){...}) // Iterate through each cookie
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript

cy.each(function(){...})            // Errors, cannot be chained off 'cy'
cy.location().each(function(){...}) // Errors, 'location' doesn't yield an array
```

## Arguments

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that is invoked with the following arguments:

- `value`
- `index`
- `collection`

## Yields {% yields %}

`.each()` yields the original array.

## Timeout

# Examples

## DOM Elements

**Iterate over an array of DOM elements**

```javascript
cy
  .get('ul>li')
  .each(function($el, index, $list){
    // $el is a wrapped jQuery element
    if ($el.someMethod() === 'something') {
      // wrap this element so we can
      // use cypress commands on it
      cy.wrap($el).click()
    } else {
      // do something else
    }
  })
```

**The original array is always yielded**

No matter what is returned in the callback function, `.each()` will always yield the original array.

```javascript
cy
  .get('li').should('have.length', 3)
  .each(function($li, index, $lis){
    return 'something else'
  })
  .then(function($lis){
    expect($lis).to.have.length(3) // true
  })
```

## Promises

**Promises are awaited**

If your callback function returns a `Promise`, it will be awaited before iterating over the next element in the collection.

```javascript
cy.wrap([1,2,3]).each(function(num, i, array){
  return new Cypress.Promise(function(resolve){
    setTimeout(function(){
      resolve()
    }, num * 100)
  })
})
```

# Notes

**Stop `each` prematurely**

You can stop the `.each()` loop early by returning `false` in the callback function.

# Command Log

**`cy.each()` does *not* log in the command log**

# See also

- {% url `.spread()` spread %}
- {% url `.then()` then %}
