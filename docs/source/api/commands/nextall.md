---
title: nextAll
comments: true
---

Get all following siblings of each DOM element in a set of matched DOM elements.

# Syntax

```javascript
.nextAll()
.nextAll(selector)
.nextAll(options)
.nextAll(selector, options)
```

## Usage

`.nextAll()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.active').nextAll() // Yield all links next to `.active`
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.nextAll()                // Errors, cannot be chained off 'cy'
cy.getCookies().nextAll()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.nextAll()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.nextAll()` yields the new DOM elements found by the command.

## Timeout

`.nextAll()` will continue to look for all next element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## All Next

**Find all of the element's siblings following `.second`**

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

**Find all of the following siblings of each li. Keep only the ones with a class `selected`.**

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

# Command Log

**Find all elements following the `.active` li**

```javascript
cy.get('.left-nav').find('li.active').nextAll()
```

The commands above will display in the command log as:

<img width="560" alt="screen shot 2017-03-23 at 2 05 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/24262886/e1513334-0fd1-11e7-93b1-b413a9390828.png">

When clicking on `nextAll` within the command log, the console outputs the following:

<img width="567" alt="screen shot 2017-03-23 at 2 05 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/24262907/f2b7fe78-0fd1-11e7-921c-6eabf6e32abb.png">

# See also

- {% url `.next()` next %}
- {% url `.nextUntil()` nextuntil %}
- {% url `.prevAll()` prevall %}
