---
title: first
comments: false
---

Get the first DOM element within a set of DOM elements.

{% note info %}
The querying behavior of this command matches exactly how {% url `.first()` http://api.jquery.com/first %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.first()
.first(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('nav a').first()     // Yield first link in nav
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.first()                  // Errors, cannot be chained off 'cy'
cy.getCookies().first()     // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.first()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .first %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .first %}

# Examples

## No Args

***Get the first list item in a list.***

```html
<ul>
  <li class="one">Knick knack on my thumb</li>
  <li class="two">Knick knack on my shoe</li>
  <li class="three">Knick knack on my knee</li>
  <li class="four">Knick knack on my door</li>
</ul>
```

```javascript
// yields <li class="one">Knick knack on my thumb</li>
cy.get('li').first()
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .first %}

## Assertions {% helper_icon assertions %}

{% assertions existence .find %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .first %}

# Command Log

***Find the first input in the form***

```javascript
cy.get('form').find('input').first()
```

The commands above will display in the command log as:

![Command Log first](/img/api/first/get-the-first-in-list-of-elements.png)

When clicking on `first` within the command log, the console outputs the following:

![console.log first](/img/api/first/console-log-the-first-element.png)

# See also

- {% url `.last()` last %}
