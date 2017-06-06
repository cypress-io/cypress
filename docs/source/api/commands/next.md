---
title: next
comments: true
description: ''
---

Get the immediately following sibling of each DOM element within a set of DOM elements.

# Syntax

```javascript
.next()
.next(selector)
.next(options)
.next(selector, options)
```

## Usage

`.next()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('nav a:first').next() // Yield next link in nav
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.next()                // Errors, cannot be chained off 'cy'
cy.getCookies().next()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.next()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.next()` yields the new DOM element(s) found by the command.

## Timeout

`.next()` will continue to look for the next element for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Next

**Find the element next to `.second`**

```html
<ul>
  <li>apples</li>
  <li class="second">oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
// yields <li>bananas</li>
cy.get('.second').next()
```

## Selector

**Find the very next sibling of each li. Keep only the ones with a class `selected`.**

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li class="selected">pineapples</li>
</ul>
```

```javascript
// yields <li>pineapples</li>
cy.get('li').next('.selected')
```

# Command Log

**Find the element next to the `.active` li**

```javascript
cy.get('.left-nav').find('li.active').next()
```

The commands above will display in the command log as:

<img width="563" alt="screen shot 2015-11-29 at 12 42 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458857/afcfddf2-9696-11e5-9405-0cd994f70d45.png">

When clicking on `next` within the command log, the console outputs the following:

<img width="547" alt="screen shot 2015-11-29 at 12 42 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458858/b30b0a0a-9696-11e5-99b9-d785b597287c.png">

# See also

- [nextall](https://on.cypress.io/api/nextall)
- [nextUntil](https://on.cypress.io/api/nextuntil)
- [prev](https://on.cypress.io/api/prev)
