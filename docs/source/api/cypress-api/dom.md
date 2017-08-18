---
title: Cypress.dom
comments: false
---

`Cypress.dom.isHidden()` allows you to work with logic that determines whether an element is hidden.

# Syntax

```javascript
Cypress.dom.isHidden(element)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.dom.isHidden('form')
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.dom.isHidden('form')  // Errors, cannot be chained off 'cy'
```

# Examples

## Is Hidden

**Returns a boolean indicating whether an element is hidden.**

Cypress internally uses this method *everywhere* to figure out whether an element is hidden, {% url "mostly for actionability" interacting-with-elements %}.

```javascript
var $el = $("#modal")

Cypress.dom.isHidden($el) // => false
```
