---
title: then
comments: false
---

Enables you to work with the subject yielded from the previous command.

# Syntax

```javascript
.then(callbackFn)
.then(options, callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('.nav').then(($nav) => {})  // Yields .nav as first arg
cy.location().then((loc) => {})   // Yields location object as first arg
```

## Arguments

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the previously yielded subject as it's first argument.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.then()`.

Option | Default | Description
--- | --- | ---
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .then %}

## Yields {% helper_icon yields %}

`.then()` is modeled identically to the way Promises work in JavaScript.  Whatever is returned from the callback function becomes the new subject and will flow into the next command (with the exception of `null` and `undefined`).

When `null` or `undefined` are returned by the callback function, the subject will not be modified and will instead carry over to the next command.

Just like Promises, you can return any compatible "thenable" (anything that has a `.then()` interface) and Cypress will wait for that to resolve before continuing forward through the chain of commands.

# Examples

## DOM element

***The element `input` is yielded***

```javascript
cy.get('form').find('input').then(($input) => {
  // work with $input here
})
```

## Change subject

***The subject is changed by returning***

```javascript
cy.then(() => {
  return {id: 123}
})
.then((obj) =>{
  // subject is now the obj {id: 123}
  expect(obj.id).to.eq(123) // true
})
```

***Returning `null` or `undefined` will not modify the yielded subject***

```javascript
cy
  .get('form').then(($form) => {
    console.log('form is:', $form)
    // undefined is returned here, but $form will be
    // yielded to allow for continued chaining
  })
  .find('input').then(($input) =>{
    // we have our $input element here since
    // our form element was yielded and we called
    // .find('input') on it
  })
```

## Promises

Cypress waits for Promises to resolve before continuing

***Example using Q***

```javascript
cy.get('button').click().then(($button) => {
  var p = Q.defer()

  setTimeout(() => {
    p.resolve()
  }, 1000)

  return p.promise
})
```

***Example using bluebird***

```javascript
cy.get('button').click().then(($button) => {
  return Promise.delay(1000)
})
```

***Example using jQuery deferred's***

```javascript
cy.get('button').click().then(($button) => {
  var df = $.Deferred()

  setTimeout(() => {
    df.resolve()
  }, 1000)

  return df
})
```

# Notes

## Differences

{% partial then_should_difference %}

# Rules

## Requirements {% helper_icon requirements %}

{% requirements child .then %}

## Assertions {% helper_icon assertions %}

{% assertions once .then %}

## Timeouts {% helper_icon timeout %}

{% timeouts promises .then %}

# Command Log

- `cy.then()` does *not* log in the command log

# See also

- {% url `.and()` and %}
- {% url `.each()` each %}
- {% url `.invoke()` invoke %}
- {% url `.its()` its %}
- {% url `.should()` should %}
- {% url `.spread()` spread %}
- {% url 'Guide: Chains of Commands' introduction-to-cypress#Chains-of-Commands %}
