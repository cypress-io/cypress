slug: focused
excerpt: Get the DOM element that is focused

Get the DOM element that is currently focused.

| | |
|--- | --- |
| **Returns** | the current DOM element that is focused or `null` |
| **Timeout** | `cy.focused` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.focused()](#section-usage)

Get the focused DOM element.

***

# Options

Pass in an options object to change the default behavior of `cy.focused`.

**cy.focused( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Get the element that is focused.

```javascript
cy.focused()
```

***

## Make an assertion on the focused element.

```javascript
cy.focused().should("have.attr", "name", "username")
```

***

# Command Log

## Make an assertion on the focused element.


```javascript
cy.focused().should("have.attr", "name").and("eq", "num")
```

The commands above will display in the command log as:

<img width="523" alt="screen shot 2015-11-27 at 1 01 51 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446780/f71fb350-9509-11e5-963a-a6940fbc63b6.png">

When clicking on the `focused` command within the command log, the console outputs the following:

<img width="407" alt="screen shot 2015-11-27 at 1 02 02 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446771/d104a6d0-9509-11e5-9464-2e397cb1eb24.png">

***

# Related

- [focus](https://on.cypress.io/api/focus)
- [blur](https://on.cypress.io/api/blur)