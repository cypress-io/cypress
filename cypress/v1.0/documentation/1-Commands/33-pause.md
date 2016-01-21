slug: pause
excerpt: Pause command

# [cy.pause()](#usage)

`cy.pause` will stop command execution and allow you the ability to interact with your app, resume commands when you're ready, or step into the next command.

***

# Options

Pass in an options object to change the default behavior of `cy.pause`.

**cy.pause(*options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

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