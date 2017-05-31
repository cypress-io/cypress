---
title: parentsuntil
comments: true
description: ''
---

Get all ancestors of each DOM element in a set of matched DOM elements up to, but not including, the element provided.

# Syntax

```javascript
.parentUntil(selector)
.parentUntil(selector, filter)
.parentUntil(selector, filter, options)
.parentUntil(element)
.parentUntil(element, filter)
.parentUntil(element, filter, options)
```

## Usage

`.parentsUntil()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('p').parentsUntil('.article') // Yield parents of 'p' until '.article'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.parentsUntil()                  // Errors, cannot be chained off 'cy'
cy.location().parentsUntil('href') // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

The selector where you want finding parent ancestors to stop.

**{% fa fa-angle-right %} element**  ***(DOM node, jQuery Object)***

The element where you want finding parent ancestors to stop.

**{% fa fa-angle-right %} filter**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.parentsUntil()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element(s)

## Yields

`.parentsUntil()` yields the new DOM element(s) found by the command.

## Timeout

`.parentsUntil()` will continue to look for the parent element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts)

# Examples

## Selector

**Find all of the `.active` element's ancestors until `.nav`**

```html
<ul class="nav">
  <li>
    <a href="#">Clothes</a>
    <ul class="menu">
      <li>
        <a href="/shirts">Shirts</a>
      </li>
      <li class="active">
        <a href="/pants">Pants</a>
      </li>
    </ul>
  </li>
</ul>
```

```javascript
// yields [ul.menu, li]
cy.get('.active').parentsUntil('.nav')
```

# Command Log

**Find all of the `.active` element's ancestors until `.nav`**

```javascript
cy.get('.active').parentsUntil('.nav')
```

The commands above will display in the command log as:

<img width="561" alt="screen shot 2017-03-23 at 2 37 31 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264301/516d5fd6-0fd6-11e7-9ab7-b55b211acde3.png">

When clicking on `parentsUntil` within the command log, the console outputs the following:

<img width="523" alt="screen shot 2017-03-23 at 2 37 39 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264309/60cc75de-0fd6-11e7-97b4-d0aa184b0ba6.png">

# See also

- [parent](https://on.cypress.io/api/parent)
- [parents](https://on.cypress.io/api/parents)
- [prevUntil](https://on.cypress.io/api/prevuntil)
- [nextUntil](https://on.cypress.io/api/nextuntil)
