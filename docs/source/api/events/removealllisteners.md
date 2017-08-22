---
title: removeAllListeners
comments: false
---

Remove all listener attached with {% url '`on`' on %} or {% url '`once`' once %} to a {% url 'Cypress event' catalog-of-events %}.

# Syntax

```javascript
Cypress.removeAllListeners()
cy.removeAllListeners()
Cypress.removeAllListeners(eventName)
cy.removeAllListeners(eventName)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.on('fail', function(err) {})
Cypress.removeAllListeners('fail')

cy.on('window:load', function(err) {})
cy.removeAllListeners()      
```

## Arguments

**{% fa fa-angle-right %} eventName** ***(String)***

The name of the event to have the listener removed from. Available events can be found {% url 'here' catalog-of-events %}.

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the event's arguments.

# Examples

## Remove all event listeners

***On log added***

```js
getLog = function(log) {
  // do what you want with log data here
})

Cypress.on('log:added', getLog)
Cypress.removeAllListeners('log:added')
```

# See also

- {% url 'Catalog of Events' catalog-of-events %}
- {% url '`on`' on %}
- {% url '`once`' once %}
- {% url '`removeListener`' removelistener %}
- {% url '`removeAllListeners`' removealllisteners %}
