excerpt: Format or parse dates using moment methods
slug: moment

Cypress automatically proxies [`moment.js`](http://momentjs.com/) and exposes it as `cy.moment`.

### [cy.moment()](#usage)

Use `cy.moment` to help format or parse dates.

***

## Usage

```javascript
var todaysDate = cy.moment().format("MMM DD, YYYY")

// maybe test that the span contains formatted text for today
cy.get("span").should("contain", "Place your order for: " + todaysDate)
```