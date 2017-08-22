---
title: once
comments: false
---

Attach a callback function to a {% url 'Cypress event' catalog-of-events %}. The callback will be invoked whenever the event is fired. Just like {% url "on" on %}, but causes the callback function to only be invoked once before being removed.

# Syntax

```javascript
Cypress.once(eventName, callbackFn)
cy.once(eventName, callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.once('window:load', function(err) {}) // not automatically unbound between tests
cy.once('window:load', function(err) {})      // automatically unbound between tests
```

## Arguments

**{% fa fa-angle-right %} eventName** ***(String)***

The name of the event to listen to. Available events can be found {% url 'here' catalog-of-events %}.

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the event's arguments.

# Examples

## Listen to Events

***On first uncaught exception***

```js
Cypress.once('uncaught:exception', function(err, runnable) {
  // if you return false from an uncaught:exception handler
  // then the uncaught exception error will not be
  // thrown or cause the test to fail
  return false
})
```

***On first test failure***

```js
it('did fail', function(done) {
  cy.once('fail', function(err, runnable) {
    expect(err).to.eq('Oops, there was a problem.')
    return done()
  })

  cy.visit('/')
  cy.get('some-element-that-doesnt-exist')
})
```

# See also

- {% url 'Catalog of Events' catalog-of-events %}
- {% url '`on`' on %}
- {% url '`removeAllListeners`' removealllisteners %}
- {% url '`removeListener`' removelistener %}
