slug: cypress-moment
excerpt: Format or parse dates using moment methods

# [Cypress.moment()](#section-usage)

Cypress automatically proxies [`moment.js`](http://momentjs.com/) and exposes it as `Cypress.moment`.

Use `Cypress.moment` to help format or parse dates.

***

# Usage

```javascript
var todaysDate = Cypress.moment().format("MMM DD, YYYY")

// test that the span contains formatted text for today
cy.get("span").should("contain", "Order shipped on: " + todaysDate)
```