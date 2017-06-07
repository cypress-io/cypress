---
title: first
comments: true
---

Get the first DOM element within a set of DOM elements.

# Syntax

```javascript
.first()
.first(options)
```

## Usage

`.first()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('nav a').first()     // Yield first link in nav
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.first()                  // Errors, cannot be chained off 'cy'
cy.getCookies().first()     // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.first()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.first()` yields the new DOM element found by the command.

## Timeout

`.first()` will continue to look for the first element for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## First element

**Get the first list item in a list.**

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
cy.get('ul').first()
```

# Command Log

**Find the first input in the form**

```javascript
cy.get('form').find('input').first()
```

The commands above will display in the command log as:

<img width="527" alt="screen shot 2015-11-29 at 12 28 08 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458770/d9439ee6-9694-11e5-8754-b2641ba44883.png">

When clicking on `first` within the command log, the console outputs the following:

<img width="616" alt="screen shot 2015-11-29 at 12 28 23 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458771/db8cb516-9694-11e5-86c2-cf3bbb9a666d.png">

# See also

- [last](https://on.cypress.io/api/last)
