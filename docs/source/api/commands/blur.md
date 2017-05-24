---
title: blur
comments: true
description: ''
---

Make a focused DOM element blur.

# Syntax

```javascript
.blur()
.blur(options)
```

## Usage

`.blur()` requires being chained off another cy command that *yields* a DOM element that is currently in focus.

If you want to ensure an element is focused before blurring, try using [`.focus()`](https://on.cypress.io/focus) before `.blur()`

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('[type="email"]').type('me@email.com').blur() // Blurs email input
cy.get('[tabindex="1"]').focus().blur()              // Blurs el with tabindex
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.blur('input')              // Errors, cannot be chained off 'cy'
cy.window().blur()            // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.blur`.

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces blur, disables checking if el is focusable or focused
`log` | `true` | whether to display command in command log

## Yields

`.blur()` yields the DOM element from the previous command.

## Timeout

`.blur()` will continue to look for the focusable element to blur for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts)

# Examples

## Blur

**Blur the comment input.**

```javascript
cy.get('[name="comment"]').type('Nice Product!').blur()
```

# Options

**Blur the first input, ignoring whether the input is currently focused.**

```javascript
cy.get('input:first').blur({ force: true })
```

# Notes

**`.blur()` can time out because your browser did not receive any blur events.**

If you see this error, you may want to ensure that the main browser window is currently focused. This means not being focused in debugger or any other window when the command is run.

# Command Log

**Blur a textarea after typing.**

```javascript
cy.get('[name="comment"]').focus().type('Nice Product!').blur()
```

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 37 36 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446921/58a14e34-950c-11e5-85ba-633b7ed5d7f1.png">

When clicking on the `blur` command within the command log, the console outputs the following:

<img width="525" alt="screen shot 2015-11-27 at 1 37 53 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446923/5c44a2ca-950c-11e5-8080-0dc108bc4959.png">

# See also

- [focused](https://on.cypress.io/api/focused)
- [focus](https://on.cypress.io/api/focus)
