---
title: removeListener
comments: false
---

Remove a listener attached with {% url '`on`' on %} or {% url '`once`' once %} to a {% url 'Cypress event' catalog-of-events %}.

# Syntax

```javascript
Cypress.removeListener(eventName, callbackFn)
cy.removeListener(eventName, callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.on('fail', function(err) {})
Cypress.removeListener('fail', function(err) {})

cy.on('window:load', function(err) {})
cy.removeListener('window:load', function(err) {})      
```

## Arguments

**{% fa fa-angle-right %} eventName** ***(String)***

The name of the event to have the listener removed from. Available events can be found {% url 'here' catalog-of-events %}.

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the event's arguments.

# Examples

## Remove event listener

***On uncaught exception***

```js
stopUncaughtExceptions = function(err, runnable) {
  // if you return false from an uncaught:exception handler
  // then the uncaught exception error will not be
  // thrown or cause the test to fail
  return false
})

Cypress.on('uncaught:exception', stopUncaughtExceptions)
Cypress.removeListener('uncaught:exception', stopUncaughtExceptions)
```

# See also

- {% url 'Catalog of Events' catalog-of-events %}
- {% url '`on`' on %}
- {% url '`once`' once %}
- {% url '`removeAllListeners`' removealllisteners %}
