---
title: then
comments: true
description: ''
---

Yield the current yielded subject as the first argument of a function.

# Syntax

```javascript
.spread(callbackFn)
.spread(options, callbackFn)
```

## Usage

`.then()`  should be chained off another cy command.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.nav').then(function(nav) {})  // Yields .nav as first arg
cy.location().then(function(loc) {})   // Yields location object as first arg
```

## Arguments

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the current yielded subject as it's first argument.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.then()`.

Option | Default | Notes
--- | --- | ---
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to yield the then

## Yields

`.then()` is modeled identically to the way Promises work in JavaScript.  Whatever is returned from the callback function becomes the new subject and will flow into the next command (with the exception of `null` and `undefined`).

When `null` or `undefined` is returned by the callback function, the subject will not be modified and will instead carry over to the next command.

Just like Promises, you can return any compatible "thenable" (anything that has a `.then()` interface) and Cypress will wait for that to resolve before continuing forward through the chain of commands.

## Timeout

`.then` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options).

# Examples

## Work with DOM element

**The element `input` is yielded**

```html
<form id="todos">
  <input type="text" class="addTodo" />
</form>
```

```javascript
cy.get('form').find('input').then(function($input){
  // work with $input here
})
```

## Change subject

**The subject is changed by returning `{foo: 'bar'}`**

```javascript
cy.then(function(){
  return {foo: 'bar'}
}).then(function(obj){
  // subject is now the obj {foo: 'bar'}
  expect(obj).to.deep.eq({foo: 'bar'}) // true
})
```

**Returning `null` or `undefined` will not modify the subject**

```javascript
cy
  .get('form').then(function($form){
    console.log('form is:', $form)
    // undefined is returned here, therefore
    // the $form subject will automatically
    // carry over and allow for continued chaining
  }).find('input').then(function($input){
    // we have our real $input element here since
    // our form element carried over and we called
    // .find("input") on it
  })
```

## Promises

**Cypress waits for the Promise to resolve before continuing**

***Example using Q***

```javascript
cy.get('button').click().then(function($button){
  var p = Q.defer()

  setTimeout(function(){
    p.resolve()
  }, 5000)

  return p.promise
})
```

***Example using bluebird***

```javascript
cy.get('button').click().then(function($button){
  return Promise.delay(5000)
})
```

***Example using jQuery deferred's***

```javascript
cy.get('button').click().then(function($button){
  var df = $.Deferred()

  setTimeout(function(){
    df.resolve()
  }, 5000)

  return df
})
```

# See also

- [and](https://on.cypress.io/api/and)
- [its](https://on.cypress.io/api/its)
- [invoke](https://on.cypress.io/api/invoke)
- [should](https://on.cypress.io/api/should)
- [spread](https://on.cypress.io/api/spread)
- [Issuing Commands](https://on.cypress.io/guides/issuing-commands)
