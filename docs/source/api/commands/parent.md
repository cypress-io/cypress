---
title: parent
comments: true
---

Get the parent DOM element of a set of DOM elements.

# Syntax

```javascript
.parent()
.parent(selector)
.parent(options)
.parent(selector, options)
```

## Usage

`.parent()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('header').parent() // Yield parent el of `header`
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.parent()            // Errors, cannot be chained off 'cy'
cy.reload().parent()   // Errors, 'reload' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.parent()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.parent()` yields the new DOM element(s) found by the command.

## Timeout

`.parent()` will continue to look for the parent element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Parent

**Get the parent of the active li**

```javascript
cy.get('li.active').parent()
```

## Selector

**Get the parent with class `nav` of the active li**

```javascript
cy.get('li.active').parent('.nav')
```

# Command Log

**Assert on the parent of the active li**

```javascript
cy.get('li.active').parent().should('have.class', 'nav')
```

The commands above will display in the command log as:

<img width="531" alt="screen shot 2015-11-27 at 1 58 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447127/0d9ab5a8-950f-11e5-90ae-c317dd83aa65.png">

When clicking on the `parent` command within the command log, the console outputs the following:

<img width="440" alt="screen shot 2015-11-27 at 1 58 44 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447130/11b22c02-950f-11e5-9b82-cc3b2ff8548e.png">

# See also

- {% url `.children()` children %}
- [parents](https://on.cypress.io/api/parents)
- [parentsUntil](https://on.cypress.io/api/parentsuntil)
