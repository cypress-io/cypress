slug: blur
excerpt: Blur a DOM element

Make the DOM element found in the previous command lose focus.

**The following events are fired during blur:** `focusout`, `blur`

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.blur` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.blur()](#usage)

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

# Errors

## cy.blur() can only be called when there is a currently focused element.

There is currently no specific element that has focus. If you want to ensure focus before blurring, try using `cy.focus()` on the element before `cy.blur()`

## cy.blur() timed out because your browser did not receive any blur events. This is a known bug in Chrome when it is not the currently focused window.

If you see this error, you may want to ensure that the main browser window is currently focused. This means not being focused in debugger or any other window when the command is executed.

## cy.blur() can only be called on the focused element.

If you want to ensure focus on a specific element before blurring, try using `cy.focus()` on the element before `cy.blur()`

***

# Related

- [focused](https://on.cypress.io/api/focused)
- [focus](https://on.cypress.io/api/focus)
