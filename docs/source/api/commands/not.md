---
title: not
comments: false
---

Filter DOM element(s) from a set of DOM elements.

{% note info %}
Opposite of {% url `.filter()` filter %}
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

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .not %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .not %}

## Timeouts {% helper_icon timeout %}

`.not()` will continue to look for the element(s) for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

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

![Command Log not](/img/api/not/filter-elements-with-not-and-optional-selector.png)

When clicking on `not` within the command log, the console outputs the following:

![Console log not](/img/api/not/log-elements-found-when-using-cy-not.png)

# See also

- {% url `.filter()` filter %}
