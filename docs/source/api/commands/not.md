---
title: not
comments: false
---

Filter DOM element(s) from a set of DOM elements.

{% note info %}
Opposite of {% url `.filter()` filter %}
{% endnote %}

{% note info %}
The querying behavior of this command matches exactly how {% url `.not()` http://api.jquery.com/not %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.not(selector)
.not(selector, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('input').not('.required') // Yield all inputs without class '.required'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.not('.icon')      // Errors, cannot be chained off 'cy'
cy.location().not()  // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to remove matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.not()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .not %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .not %}

# Examples

## Selector

***Yield the elements that do not have class `active`.***

```javascript
cy.get('.left-nav>li').not('.active').should('not.have.class', 'active') // true
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .not %}

## Assertions {% helper_icon assertions %}

{% assertions existence .not %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .not %}

# Command Log

***Find all buttons that are not of type submit***

```javascript
cy.get('form').find('button').not('[type="submit"]')
```

The commands above will display in the command log as:

![Command Log not](/img/api/not/filter-elements-with-not-and-optional-selector.png)

When clicking on `not` within the command log, the console outputs the following:

![Console log not](/img/api/not/log-elements-found-when-using-cy-not.png)

# See also

- {% url `.filter()` filter %}
