---
title: prevAll
comments: false
---

Get all previous siblings of each DOM element in a set of matched DOM elements.

{% note info %}
The querying behavior of this command matches exactly how {% url `.prevAll()` http://api.jquery.com/prevAll %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.prevAll()
.prevAll(selector)
.prevAll(options)
.prevAll(selector, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('.active').prevAll() // Yield all links previous to `.active`
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.prevAll()                // Errors, cannot be chained off 'cy'
cy.getCookies().prevAll()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.prevAll()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .prevAll %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .prevAll %}

# Examples

## No Args

***Find all of the element's siblings before `.third`***

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li class="third">bananas</li>
  <li>pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
// yields [<li>apples</li>, <li>oranges</li>]
cy.get('.third').prevAll()
```

## Selector

***Find all of the previous siblings of each li. Keep only the ones with a class `selected`.***

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
cy.get('li').prevAll('.selected')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .prevAll %}

## Assertions {% helper_icon assertions %}

{% assertions existence .prevAll %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .prevAll %}

# Command Log

***Find all elements before the `.active` li***

```javascript
cy.get('.left-nav').find('li.active').prevAll()
```

The commands above will display in the command log as:

![Command Log](/img/api/prevall/find-all-previous-elements-with-optional-selector.png)

When clicking on `prevAll` within the command log, the console outputs the following:

![Console Log](/img/api/prevall/console-log-all-previous-elements-traversed.png)

# See also

- {% url `.nextAll()` nextall %}
- {% url `.parents()` parents %}
- {% url `.prev()` prev %}
- {% url `.prevUntil()` prevuntil %}
