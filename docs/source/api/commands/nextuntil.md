---
title: nextUntil
comments: false
---

Get all following siblings of each DOM element in a set of matched DOM elements up to, but not including, the element provided.

{% note info %}
The querying behavior of this command matches exactly how {% url `.nextUntil()` http://api.jquery.com/nextUntil %} works in jQuery.
{% endnote %}

# Syntax

```javascript
.nextUntil(selector)
.nextUntil(selector, filter)
.nextUntil(selector, filter, options)
.nextUntil(element)
.nextUntil(element, filter)
.nextUntil(element, filter, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('div').nextUntil('.warning') // Yield siblings after 'div' until '.warning'
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.nextUntil()                  // Errors, cannot be chained off 'cy'
cy.location().nextUntil('path') // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

The selector where you want finding next siblings to stop.

**{% fa fa-angle-right %} element**  ***(DOM node, jQuery Object)***

The element where you want finding next siblings to stop.

**{% fa fa-angle-right %} filter**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.nextUntil()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .nextUntil %}

## Yields {% helper_icon yields %}

{% yields changes_dom_subject .nextUntil %}

# Examples

## Selector

***Find all of the element's siblings following `#veggies` until `#nuts`***

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
//returns [<li>cucumbers</li>, <li>carrots</li>, <li>corn</li>]
cy.get('#veggies').nextUntil('#nuts')
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .nextUntil %}

## Assertions {% helper_icon assertions %}

{% assertions existence .nextUntil %}

## Timeouts {% helper_icon timeout %}

{% timeouts existence .nextUntil %}

# Command Log

***Find all of the element's siblings following `#veggies` until `#nuts`***

```javascript
cy.get('#veggies').nextUntil('#nuts')
```

The commands above will display in the command log as:

![Command Log nextUntil](/img/api/nextuntil/find-next-elements-until-selector.png)

When clicking on `nextUntil` within the command log, the console outputs the following:

![Console Log nextUntil](/img/api/nextuntil/console-log-of-next-elements-until.png)

# See also

- {% url `.next()` next %}
- {% url `.nextAll()` nextall %}
- {% url `.parentsUntil()` parentsuntil %}
- {% url `.prevUntil()` prevuntil %}
