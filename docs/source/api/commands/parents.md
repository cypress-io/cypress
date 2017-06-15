---
title: parents
comments: false
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
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the elements


## Yields

`.parents()` yields the new DOM element(s) found by the command.

## Timeout

`.parents()` will continue to look for the next element(s) for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

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

![Command Log parents](https://cloud.githubusercontent.com/assets/1271364/11447168/be286244-950f-11e5-82e8-9a2a6d1d08e8.png)

When clicking on the `parents` command within the command log, the console outputs the following:

![Console Log parents](https://cloud.githubusercontent.com/assets/1271364/11447171/c1ba5ef8-950f-11e5-9f2d-7fbd0b142649.png)

# See also

- {% url `.children()` children %}
- {% url `.parent()` parent %}
- {% url `.parentsUntil()` parentsuntil %}
