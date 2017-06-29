---
title: Cypress.Dom
comments: false
---

`Cypress.Dom.isHidden()` allows you to work with logic that determines whether an element is hidden.

# Syntax

```javascript
Cypress.Dom.isHidden(element)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.Dom.isHidden('form')
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.Dom.isHidden('form')  // Errors, cannot be chained off 'cy'
```

# Examples

## Is Hidden

**Returns a boolean indicating whether an element is hidden.**

Cypress internally uses this method *everywhere* to figure out whether an element is hidden.

```javascript
var $el = $("#modal")

Cypress.Dom.isHidden($el) // => false
```
