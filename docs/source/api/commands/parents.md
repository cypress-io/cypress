---
title: parents
comments: true
---

Get the parent DOM elements of a set of DOM elements.

# Syntax

```javascript
.parents()
.parents(selector)
.parents(options)
.parents(selector, options)
```

## Usage

`.parents()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('aside').parents()  // Yield parents of aside
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.parents()              // Errors, cannot be chained off 'cy'
cy.go('back').parents()   // Errors, 'go' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.parents()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the elements


## Yields

`.parents()` yields the new DOM element(s) found by the command.

## Timeout

`.parents()` will continue to look for the next element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Parents

**Get the parents of the active li**

```javascript
cy.get('li.active').parents()
```

## Selector

**Get the parents with class `nav` of the active li**

```javascript
cy.get('li.active').parents('.nav')
```

# Command Log

**Get the parents of the active `li`**

```javascript
cy.get('li.active').parents()
```

<img width="531" alt="screen shot 2015-11-27 at 2 02 59 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447168/be286244-950f-11e5-82e8-9a2a6d1d08e8.png">

When clicking on the `parents` command within the command log, the console outputs the following:

<img width="537" alt="screen shot 2015-11-27 at 2 03 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447171/c1ba5ef8-950f-11e5-9f2d-7fbd0b142649.png">

# See also

- [children](https://on.cypress.io/api/children)
- [parent](https://on.cypress.io/api/parent)
- [parentsUntil](https://on.cypress.io/api/parentsuntil)
