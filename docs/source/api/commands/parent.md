---
title: parent
comments: false
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

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .parent %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .parent %}

## Timeouts {% helper_icon timeout %}

`.parent()` will continue to look for the parent element(s) for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

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

![Command Log parent](/img/api/parent/get-parent-element-just-like-jquery.png)

When clicking on the `parent` command within the command log, the console outputs the following:

![Console Log parent](/img/api/parent/parent-command-found-elements-for-console-log.png)

# See also

- {% url `.children()` children %}
- {% url `.parents()` parents %}
- {% url `.parentsUntil()` parentsuntil %}
