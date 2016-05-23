slug: blur
excerpt: Blur a DOM element

Make the DOM element found in the previous command lose focus.

**The following events are fired during blur:** `focusout`, `blur`

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.blur` will retry for the duration of the [`commandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.blur()](#section-usage)

Blur the DOM element from the previous command.

***

# Options

Pass in an options object to change the default behavior of `cy.blur`.

**[cy.blur( *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces blur, disables error checking prior to blur
`log` | `true` | whether to display command in command log

***

# Usage

## Blur the comment input.

```javascript
// returns the same <textarea> for further chaining
cy.get("[name='comment']").type("Nice Product!").blur()
```

***

# Options Usage

## Blur the first input, ignoring whether the input is currently focused.

```javascript
// returns the same <input> for further chaining
cy.get("input:first").blur({force: true})
```

***

# Command Log

## Blur a textarea after typing.

```javascript
cy.get("[name='comment']").type("Nice Product!").blur()
```

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 37 36 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446921/58a14e34-950c-11e5-85ba-633b7ed5d7f1.png">

When clicking on the `blur` command within the command log, the console outputs the following:

<img width="525" alt="screen shot 2015-11-27 at 1 37 53 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446923/5c44a2ca-950c-11e5-8080-0dc108bc4959.png">

***

# Related

- [focused](https://on.cypress.io/api/focused)
- [focus](https://on.cypress.io/api/focus)