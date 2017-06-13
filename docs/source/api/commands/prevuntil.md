---
title: prevUntil
comments: false
---

Get all previous siblings of each DOM element in a set of matched DOM elements up to, but not including, the element provided.

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

`.prevUntil()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('p').prevUntil('.intro') // Yield siblings before 'p' until '.intro'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

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

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the element(s)

## Yields

`.prevUntil()` yields the new DOM element(s) found by the command.

## Timeout

`.prevUntil()` will continue to look for the previous element(s) for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Selector

**Find all of the element's siblings before `#nuts` until `#veggies`**

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

# Command Log

**Find all of the element's siblings before `#nuts` until `#veggies`**

```javascript
cy.get('#nuts').prevUntil('#veggies')
```

The commands above will display in the command log as:

<img width="560" alt="screen shot 2017-03-23 at 2 45 30 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264621/69ed829c-0fd7-11e7-934d-c11157c36aca.png">

When clicking on `prevUntil` within the command log, the console outputs the following:

<img width="560" alt="screen shot 2017-03-23 at 2 45 36 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264632/7743f57a-0fd7-11e7-99f8-c148acd17459.png">

# See also

- {% url `.prev()` prev %}
- {% url `.prevAll()` prevall %}
- {% url `.parentsUntil()` parentsuntil %}
- {% url `.nextUntil()` nextuntil %}
