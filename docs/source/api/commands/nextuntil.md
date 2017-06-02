---
title: nextuntil
comments: true
description: ''
---

Get all following siblings of each DOM element in a set of matched DOM elements up to, but not including, the element provided.


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

`.nextUntil()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('div').nextUntil('.warning') // Yield siblings after 'div' until '.warning'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

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

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element(s)

## Yields

`.nextUntil()` yields the new DOM element(s) found by the command.

## Timeout

`.nextUntil()` will continue to look for the next element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Selector

**Find all of the element's siblings following `#veggies` until `#nuts`**

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

# Command Log

**Find all of the element's siblings following `#veggies` until `#nuts`**

```javascript
cy.get('#veggies').nextUntil('#nuts')
```

The commands above will display in the command log as:

<img width="563" alt="screen shot 2017-03-23 at 2 17 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/24263453/96a8c0b6-0fd3-11e7-8a66-da9177ca94a7.png">

When clicking on `nextUntil` within the command log, the console outputs the following:

<img width="514" alt="screen shot 2017-03-23 at 2 18 01 pm" src="https://cloud.githubusercontent.com/assets/1271364/24263481/a20ce2f2-0fd3-11e7-881c-f6bf8d652263.png">

# See also

- [next](https://on.cypress.io/api/next)
- [nextAll](https://on.cypress.io/api/nextall)
- [parentsUntil](https://on.cypress.io/api/parentsuntil)
- [prevUntil](https://on.cypress.io/api/prevuntil)
