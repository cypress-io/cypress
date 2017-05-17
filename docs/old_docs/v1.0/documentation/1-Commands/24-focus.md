slug: focus
excerpt: Focus on a DOM element

Focus on a DOM element. If there is currently a different DOM element currently with focus, Cypress will issue a `blur` event to that element first.

**The following events are fired during focus:** `focusin`, `focus`

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.focus` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.focus()](#section-usage)

Focus on the DOM element found in the previous command.

***

# Options

Pass in an options object to change the default behavior of `cy.focus`.

**cy.focus( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log

***

# Usage

## Focus on the current subject.

```javascript
cy.get("[name='comment']").focus()
```

Focus, type, and blur the current subject.

```javascript
// returns the <textarea> for further chaining
cy.get("[name='comment']").focus().type("Nice Product!").blur()
```

***

# Command Log

## Focus the textarea.

```javascript
cy.get("[name='comment']").focus()
```

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 32 37 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446856/6c2c36f4-950b-11e5-89c6-9bf14a448b23.png">

When clicking on the `focus` command within the command log, the console outputs the following:

<img width="526" alt="screen shot 2015-11-27 at 1 33 00 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446857/703fa6c2-950b-11e5-9686-ce6b558cfd92.png">

***

# Errors

## cy.focus() can only be called on a valid focusable element.

Ensure the element you are trying to call `cy.focus()` on is a [focusable element](https://www.w3.org/TR/html5/editing.html#focusable). Most commonly, you'll want to ensure that the element is not disabled although there are [other factors](https://www.w3.org/TR/html5/editing.html#focusable).


## cy.focus() timed out because your browser did not receive any focus events. This is a known bug in Chrome when it is not the currently focused window.

If you see this error, you may want to ensure that the main browser window is currently focused. This means not being focused in debugger or any other window when the command is executed.


# Related

- [focused](https://on.cypress.io/api/focused)
- [blur](https://on.cypress.io/api/blur)
- [click](https://on.cypress.io/api/click)