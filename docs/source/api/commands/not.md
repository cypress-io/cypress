---
title: not
comments: true
---

Filter DOM element(s) from a set of DOM elements.

{% note info %}
Opposite of [`.filter()`](https://on.cypress.io/api/filter)
{% endnote %}

# Syntax

```javascript
.not(selector)
.not(selector, options)
```

## Usage

`.not()` requires being chained off another cy command that *yields* a DOM element or DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('input').not('.required') // Yield all inputs without class '.required'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.not('.icon')      // Errors, cannot be chained off 'cy'
cy.location().not()  // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to remove matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.not()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.not()` yields the new DOM element(s) without the selector provided in the command's argument.

## Timeout

`.not()` will continue to look for the element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Selector

**Yield the elements that do not have class `active`.**

```javascript
cy.get('.left-nav>li').not('.active').should('not.have.class', 'active') // true
```

# Command Log

**Find all buttons that are not of type submit**

```javascript
cy.get('form').find('button').not('[type="submit"]')
```

The commands above will display in the command log as:

<img width="572" alt="screen shot 2015-11-29 at 12 36 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458817/0a846c3c-9696-11e5-9901-5f4376629e75.png">

When clicking on `not` within the command log, the console outputs the following:

<img width="689" alt="screen shot 2015-11-29 at 12 37 39 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458819/0d6870f6-9696-11e5-9364-2685b8ffc71b.png">

# See also

- [filter](https://on.cypress.io/api/filter)
