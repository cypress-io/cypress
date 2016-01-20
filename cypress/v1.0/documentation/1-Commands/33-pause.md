slug: pause
excerpt: Pause command

## [cy.pause()](#usage)

`cy.pause` will stop command execution and allow you the ability to interact with your app, resume commands when you're ready, or step into the next command.

***

## Usage

```javascript
cy
  .get("a").should("have.attr", "href").and("match", /dashboard/)
  .pause()
  .get("button").should("not.be.disabled")
```

***

## Related
1. [debug](http://on.cypress.io/api/debug)