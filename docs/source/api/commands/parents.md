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

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .parents %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .parents %}

## Defaults {% helper_icon defaultAssertion %}

{% defaults existence .parents %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .parents %}

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

![Command Log parents](/img/api/parents/get-all-parents-of-a-dom-element.png)

When clicking on the `parents` command within the command log, the console outputs the following:

![Console Log parents](/img/api/parents/parents-elements-displayed-in-devtools-console.png)

# See also

- {% url `.children()` children %}
- {% url `.parent()` parent %}
- {% url `.parentsUntil()` parentsuntil %}
