slug: debug
excerpt: Call debugger

# [cy.debug()](#usage)

`cy.debug` will call `debugger` in JavaScript.

Make sure you have your Chrome Dev Tools open for this to hit the breakpoint.

***

# Options

Pass in an options object to change the default behavior of `cy.debug`.

**cy.debug(*options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

***

# Usage

## Log out the current subject for debugging

```javascript
// Cypress will log out the current subject and other
// useful debugging information to your console
cy.get("a").debug().should("have.attr", "href")
```

***

# Related

- [pause](https://on.cypress.io/api/pause)