---
title: focused
comments: false
---

Get the DOM element that is currently focused.

# Syntax

```javascript
cy.focused()
cy.focused(options)
```

## Usage

`cy.focused()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.focused()   
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `cy.focused()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log

## Yields

`cy.focused()` yields the DOM element that is currently focused.

## Timeout

`cy.focused()` will continue to look for the focused element for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Focused

**Get the element that is focused**

```javascript
cy.focused().then(function($el) {
  // do something with $el
})
```

**Blur the element with focus**

```javascript
cy.focused().blur()
```

**Make an assertion on the focused element**

```javascript
cy.focused().should('have.attr', 'name', 'username')
```

# Command Log

**Make an assertion on the focused element**

```javascript
cy.focused().should('have.attr', 'name').and('eq', 'num')
```

The commands above will display in the command log as:

![Command Log focused](/img/api/focused/make-assertion-about-focused-element.png)

When clicking on the `focused` command within the command log, the console outputs the following:

![console focused](/img/api/focused/currently-focused-element-in-an-input.png)

# See also

- {% url `.blur()` blur %}
- {% url `.focus()` focus %}
