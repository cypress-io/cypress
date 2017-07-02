---
title: prevUntil
comments: false
---

Get all previous siblings of each DOM element in a set of matched DOM elements up to, but not including, the element provided.

{% note info %}
The querying behavior of this command matches exactly how {% url `.prevUntil()` http://api.jquery.com/prevUntil %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.prevUntil(selector)
.prevUntil(selector, filter)
.prevUntil(selector, filter, options)
.prevUntil(element)
.prevUntil(element, filter)
.prevUntil(element, filter, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('p').prevUntil('.intro') // Yield siblings before 'p' until '.intro'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.prevUntil()                  // Errors, cannot be chained off 'cy'
cy.location().prevUntil('path') // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

The selector where you want finding previous siblings to stop.

**{% fa fa-angle-right %} element**  ***(DOM node, jQuery Object)***

The element where you want finding previous siblings to stop.

**{% fa fa-angle-right %} filter**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.prevUntil()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .prevUntil %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .prevUntil %}

# Examples

## Selector

***Find all of the element's siblings before `#nuts` until `#veggies`***

```html
<ul>
  <li id="fruits" class="header">Fruits</li>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li id="veggies" class="header">Vegetables</li>
  <li>cucumbers</li>
  <li>carrots</li>
  <li>corn</li>
  <li id="nuts" class="header">Nuts</li>
  <li>walnuts</li>
  <li>cashews</li>
  <li>almonds</li>
</ul>
```

```javascript
// yields [<li>cucumbers</li>, <li>carrots</li>, <li>corn</li>]
cy.get('#nuts').prevUntil('#veggies')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .prevUntil %}

## Assertions {% helper_icon assertions %}

{% assertions existence .prevUntil %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .prevUntil %}

# Command Log

***Find all of the element's siblings before `#nuts` until `#veggies`***

```javascript
cy.get('#nuts').prevUntil('#veggies')
```

The commands above will display in the command log as:

![Command Log](/img/api/prevuntil/prev-until-finding-elements-in-command-log.png)

When clicking on `prevUntil` within the command log, the console outputs the following:

![Console Log](/img/api/prevuntil/console-log-previous-elements-until-defined-el.png)

# See also

- {% url `.prev()` prev %}
- {% url `.prevAll()` prevall %}
- {% url `.parentsUntil()` parentsuntil %}
- {% url `.nextUntil()` nextuntil %}
