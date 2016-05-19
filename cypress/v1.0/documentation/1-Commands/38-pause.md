slug: pause
excerpt: Pause a command

`cy.pause` will stop command execution and allow you to interact with your app, resume commands when you're ready, or choose when to run the next command.

This does not set a `debugger` in your code, unlike [`cy.debug`](https://on.cypress.io/api/debug)

| | |
|--- | --- |
| **Returns** | the subject from the previous command for further chaining |
| **Timeout** | *cannot timeout* |

***

# [cy.pause()](#section-usage)

Stop command execution at the current command.

***

# Options

Pass in an options object to change the default behavior of `cy.pause`.

**cy.pause(*options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

```javascript
cy
  .get("a").should("have.attr", "href").and("match", /dashboard/)
  .pause()
  .get("button").should("not.be.disabled")
```

***

# Related

- [debug](https://on.cypress.io/api/debug)