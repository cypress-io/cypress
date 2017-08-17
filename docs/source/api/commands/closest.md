---
title: closest
comments: false
---

Get the first DOM element that matches the selector (whether it be itself or one of it's ancestors).

{% note info %}
The querying behavior of this command matches exactly how {% url `.closest()` http://api.jquery.com/closest %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.closest(selector)
.closest(selector, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('td').closest('.filled') // Yield closest el with class '.filled'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.closest('.active')  // Errors, cannot be chained off 'cy'
cy.url().closest()     // Errors, 'url' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.closest()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .closest %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .closest %}

# Examples

## No Args

***Find the closest element of the 'error' with the class 'banner'***

```javascript
cy.get('p.error').closest('.banner')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .closest %}

## Assertions {% helper_icon assertions %}

{% assertions existence .closest %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .closest %}

# Command Log

***Find the closest element of 'active li' with the class 'nav'***

```javascript
cy.get('li.active').closest('.nav')
```

The commands above will display in the command log as:

![Command Log closest](/img/api/closest/find-closest-nav-element-in-test.png)

When clicking on the `closest` command within the command log, the console outputs the following:

![console.log closest](/img/api/closest/closest-console-logs-elements-found.png)

# See also

- {% url `.first()` first %}
- {% url `.parent()` parent %}
- {% url `.parents()` parents %}
- {% url `.parentsUntil()` parentsuntil %}
- {% url `.prev()` prev %}
- {% url `.prevAll()` prevall %}
- {% url `.prevUntil()` prevuntil %}
