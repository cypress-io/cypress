---
title: focused
comments: true
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

`cy.focused()` will continue to look for the focused element for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

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

<img width="523" alt="screen shot 2015-11-27 at 1 01 51 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446780/f71fb350-9509-11e5-963a-a6940fbc63b6.png">

When clicking on the `focused` command within the command log, the console outputs the following:

<img width="407" alt="screen shot 2015-11-27 at 1 02 02 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446771/d104a6d0-9509-11e5-9464-2e397cb1eb24.png">

# See also

- {% url `.blur()` blur %}
- [focus](https://on.cypress.io/api/focus)
