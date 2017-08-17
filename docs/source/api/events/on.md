---
title: on
comments: false
---

Attach a callback function to a {% url 'Cypress event' catalog-of-events %}. The callback will be invoked whenever the event is fired.

# Syntax

```javascript
Cypress.on(eventName, callbackFn)
cy.on(eventName, callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.on('fail', function(err) {}) // not automatically unbound between tests
cy.on('fail', function(err) {})      // automatically unbound between tests
```

## Arguments

**{% fa fa-angle-right %} eventName** ***(String)***

The name of the event to listen to. Available events can be found {% url 'here' catalog-of-events %}.

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the event's arguments.

# Examples

## Listen to Events

***Test that exceptions are handled properly***
```js
it('handles exception', function(done) {
  cy.on('uncaught:exception', function(err, runnable) {
    expect(err.message).to.eq('Danger, Will Robinson!')
    return done()
  })
  cy.visit('/some-page-with-uncaught-exception.html')
})
```

***On uncaught exception***

```js
Cypress.on('uncaught:exception', function(err, runnable) {
  // if you return false from an uncaught:exception handler
  // then the uncaught exception error will not be
  // thrown or cause the test to fail
  return false
})
```

***On window.confirm***

```js
cy.on('window:confirm', function(msg) {
  if (msg === 'Are you sure?') {
    return true
  } else {
    return false
  }
})
```

***On test failure***

```js
it('did fail', function(done) {
  cy.on('fail', function(err, runnable) {
    expect(err).to.eq('Oops, there was a problem.')
    return done()
  })

  cy.visit('/')
  cy.get('some-element-that-doesnt-exist')
})
```

# See also

- {% url 'Catalog of Events' catalog-of-events %}
- {% url '`once`' once %}
- {% url '`removeAllListeners`' removealllisteners %}
- {% url '`removeListener`' removelistener %}
