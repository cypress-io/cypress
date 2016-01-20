slug: moment
excerpt: Format or parse dates using moment methods

# [cy.moment()](#usage)

Cypress automatically proxies [`moment.js`](http://momentjs.com/) and exposes it as `cy.moment`.

Use `cy.moment` to help format or parse dates.

***

# Usage

```javascript
var todaysDate = cy.moment().format("MMM DD, YYYY")

// test that the span contains formatted text for today
cy.get("span").should("contain", "Order shipped on: " + todaysDate)
```