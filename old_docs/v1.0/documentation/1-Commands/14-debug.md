slug: debug
excerpt: Set a `debugger`

`cy.debug` sets a `debugger` and logs the subject from the previous command.

Make sure you have your Developer Tools open for `cy.debug` to hit the breakpoint.

| | |
|--- | --- |
| **Returns** | the subject from the previous command for further chaining. |
| **Timeout** | *cannot timeout* |

***

# [cy.debug()](#section-usage)

Debug the previous command.

***

# Options

Pass in an options object to change the default behavior of `cy.debug`.

**cy.debug(*options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

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