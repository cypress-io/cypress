slug: debug
excerpt: Call debugger

# [cy.debug()](#usage)

`cy.debug` will call `debugger` in JavaScript.

Make sure you have your Chrome Dev Tools open for this to hit the breakpoint.

```javascript
cy.get("button").debug()
```

***

# Usage

```javascript
// Cypress will log out the current subject and other
// useful debugging information to your console
cy.get("a").debug().should("have.attr", "href")
```

***

# Related

1. [pause](https://on.cypress.io/api/pause)