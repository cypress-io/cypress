excerpt: Call debugger
slug: debug

`cy.debug` will call `debugger` in JavaScript.

Make sure you have your Chrome Dev Tools open for this to hit the breakpoint.

### [cy.debug()](#usage)

```javascript
cy.get("button[type='submit']").debug()
```
***

## Usage

```javascript
// Cypress will log out the current subject and other
// useful debugging information to your console
cy.get("a").debug().should("have.attr", "href").and("match", /dashboard/)
```

***

## Related
1. [pause](http://on.cypress.io/api/pause)