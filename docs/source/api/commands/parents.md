---
title: parents
comments: false
---

Get the parent DOM elements of a set of DOM elements.

{% note info %}
The querying behavior of this command matches exactly how {% url `.parents()` http://api.jquery.com/parents %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.parents()
.parents(selector)
.parents(options)
.parents(selector, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('aside').parents()  // Yield parents of aside
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

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

# Examples

## No Args

***Get the parents of the active li***

```javascript
cy.get('li.active').parents()
```

## Selector

***Get the parents with class `nav` of the active li***

```javascript
cy.get('li.active').parents('.nav')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .parents %}

## Assertions {% helper_icon assertions %}

{% assertions existence .parents %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .parents %}

# Command Log

***Get the parents of the active `li`***

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
