---
title: nextAll
comments: false
---

Get all following siblings of each DOM element in a set of matched DOM elements.

{% note info %}
The querying behavior of this command matches exactly how {% url `.nextAll()` http://api.jquery.com/nextAll %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.nextAll()
.nextAll(selector)
.nextAll(options)
.nextAll(selector, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('.active').nextAll() // Yield all links next to `.active`
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.nextAll()                // Errors, cannot be chained off 'cy'
cy.getCookies().nextAll()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.nextAll()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .nextAll %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .nextAll %}

# Examples

## No Args

***Find all of the element's siblings following `.second`***

```html
<ul>
  <li>apples</li>
  <li class="second">oranges</li>
  <li>bananas</li>
  <li>pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
// yields [<li>bananas</li>, <li>pineapples</li>, <li>grapes</li>]
cy.get('.second').nextAll()
```

## Selector

***Find all of the following siblings of each li. Keep only the ones with a class `selected`.***

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li class="selected">pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
// yields <li>pineapples</li>
cy.get('li').nextAll('.selected')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .nextAll %}

## Assertions {% helper_icon assertions %}

{% assertions existence .nextAll %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .nextAll %}

# Command Log

***Find all elements following the `.active` li***

```javascript
cy.get('.left-nav').find('li.active').nextAll()
```

The commands above will display in the command log as:

![Command Log nextAll](/img/api/nextall/next-all-traversal-command-for-the-dom.png)

When clicking on `nextAll` within the command log, the console outputs the following:

![Console log nextAll](/img/api/nextall/all-next-elements-are-logged-in-console.png)

# See also

- {% url `.next()` next %}
- {% url `.nextUntil()` nextuntil %}
- {% url `.prevAll()` prevall %}
