---
title: Cypress.moment
comments: true
description: ''
---

Cypress automatically proxies [`moment.js`](http://momentjs.com/) and exposes it as `Cypress.moment`.

Use `Cypress.moment` to help format or parse dates.

# Syntax

```javascript
Cypress.moment()
```

## Usage

`.moment()` requires being chained off `Cypress`.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
Cypress.moment()
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.moment()  // Errors, cannot be chained off 'cy'
```

# Examples

**test that the span contains formatted text for today**

```javascript
var todaysDate = Cypress.moment().format("MMM DD, YYYY")

cy.get("span").should("contain", "Order shipped on: " + todaysDate)
```
