slug: debug

`cy.debug` will call `debugger` in JavaScript. 

Make sure you have your Chrome Dev Tools open for this to hit the breakpoint.

### [cy.debug()](#usage)

```js
cy.get("button[type='submit']").debug()
```
***

## Usage

```js
// Cypress will log out the current subject and other 
// useful debugging information to your console
cy.get("a").debug().should("have.attr", "href").and("match", /dashboard/)
```

***

## Related
1. [pause](pause)