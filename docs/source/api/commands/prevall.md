---
title: prevall
comments: true
description: ''
---

Get all previous siblings of each DOM element in a set of matched DOM elements.

# Syntax

```javascript
.prevAll()
.prevAll(selector)
.prevAll(options)
.prevAll(selector, options)
```

## Usage

`.prevAll()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.active').prevAll() // Yield all links previous to `.active`
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.prevAll()                // Errors, cannot be chained off 'cy'
cy.getCookies().prevAll()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.prevAll()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.prevAll()` yields the new DOM element(s) found by the command.

## Timeout

`.prevAll()` will continue to look for the previous elements for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## All Previous

**Find all of the element's siblings before `.third`**

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

**Find all of the previous siblings of each li. Keep only the ones with a class `selected`.**

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

# Command Log

**Find all elements before the `.active` li**

```javascript
cy.get('.left-nav').find('li.active').prevAll()
```

The commands above will display in the command log as:

<img width="562" alt="screen shot 2017-03-23 at 2 50 20 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264885/1a1d87ac-0fd8-11e7-97cb-1d0d2110de81.png">

When clicking on `prevAll` within the command log, the console outputs the following:

<img width="539" alt="screen shot 2017-03-23 at 2 50 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264898/2219d1a4-0fd8-11e7-9e8b-6b2d97166d6a.png">

# See also

- [nextAll](https://on.cypress.io/api/nextall)
- [parents](https://on.cypress.io/api/parents)
- [prev](https://on.cypress.io/api/prev)
- [prevUntil](https://on.cypress.io/api/prevuntil)
