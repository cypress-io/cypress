---
title: Cypress.moment
comments: false
---

Cypress automatically includes {% url 'moment.js' http://momentjs.com/ %} and exposes it as `Cypress.moment`.

Use `Cypress.moment` to help format or parse dates.

# Syntax

```javascript
Cypress.moment()
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.moment()
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.moment()  // Errors, cannot be chained off 'cy'
```

# Examples

**test that the span contains formatted text for today**

```javascript
var todaysDate = Cypress.moment().format("MMM DD, YYYY")

cy.get("span").should("contain", "Order shipped on: " + todaysDate)
```
