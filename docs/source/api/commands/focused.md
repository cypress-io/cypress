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

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.focused()    // Yields the element currently in focus
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `cy.focused()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout cy.focused %}

## Yields {% helper_icon yields %}

{% yields sets_dom_subject cy.focused %}

# Examples

## No Args

***Get the element that is focused***

```javascript
cy.focused().then(function($el) {
  // do something with $el
})
```

***Blur the element with focus***

```javascript
cy.focused().blur()
```

***Make an assertion on the focused element***

```javascript
cy.focused().should('have.attr', 'name', 'username')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom cy.focused %}

## Assertions {% helper_icon assertions %}

{% assertions existence cy.focused %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence cy.focused %}

# Command Log

***Make an assertion on the focused element***

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
