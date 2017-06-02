---
title: focus
comments: true
description: ''
---

Focus on a DOM element.

# Syntax

```javascript
.focus()
.focus(options)
```

## Usage

`.focus()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('input').first().focus() // Focus on the first input
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.focus('#search')  // Errors, cannot be chained off 'cy'
cy.window().focus()  // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.focus()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log

## Yields

`.focus()` yields the new DOM element that was focused.

## Timeout

`.focus()` will continue to try to focus the element for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Focus

**Focus on an input**

```javascript
cy.get('[type="input"]').focus()
```

**Focus, type, and blur a textarea**

```javascript
// yields the <textarea> for further chaining
cy.get('textarea').focus().type('Nice Product!').blur()
```

# Notes

**Cypress blurs other focused elements first**

If there is currently a different DOM element with focus, Cypress issues a `blur` event to that element before running the `.focus()` command.

**Can only be called on a valid focusable element.**

Ensure the element you are trying to call `.focus()` on is a [focusable element](https://www.w3.org/TR/html5/editing.html#focusable). Most commonly, you'll want to ensure that the element is not disabled, although there are [other factors](https://www.w3.org/TR/html5/editing.html#focusable).

**Can time out because your browser did not receive any focus events.**

If you see this error, you may want to ensure that the main browser window is currently focused. This means not being focused in debugger or any other window when the command is run.

# Command Log

**Focus the textarea**

```javascript
cy.get('[name="comment"]').focus()
```

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 32 37 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446856/6c2c36f4-950b-11e5-89c6-9bf14a448b23.png">

When clicking on the `focus` command within the command log, the console outputs the following:

<img width="526" alt="screen shot 2015-11-27 at 1 33 00 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446857/703fa6c2-950b-11e5-9686-ce6b558cfd92.png">

# See also

- [blur](https://on.cypress.io/api/blur)
- [click](https://on.cypress.io/api/click)
- [focused](https://on.cypress.io/api/focused)
- [type](https://on.cypress.io/api/type)
