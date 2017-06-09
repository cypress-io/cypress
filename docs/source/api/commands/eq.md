---
title: eq
comments: true
---

Get A DOM element at a specific index in an array of elements.

# Syntax

```javascript
.eq(index)
.eq(indexFromEnd)
.eq(index, options)
.eq(indexFromEnd, options)
```

## Usage

`.eq()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('tbody>tr').eq(0)    // Yield first 'tr' in 'tbody'
cy.get('ul>li').eq('4')     // Yield fifth 'li' in 'ul'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.eq(0)                  // Errors, cannot be chained off 'cy'
cy.getCookies().eq('4')   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} index**  ***(Number)***

A number indicating the index to find the element at within an array of elements.

**{% fa fa-angle-right %} indexFromEnd**  ***(Number)***

A negative number indicating the index position from the end to find the element at within an array of elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.eq()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.eq()` yields the new DOM elements found by the command.

## Timeout

`.eq()` will continue to look for the element at the specified index for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Index

**Find the 2nd element within the elements**

```html
<ul>
  <li>tabby</li>
  <li>siamese</li>
  <li>persian</li>
  <li>sphynx</li>
  <li>burmese</li>
</ul>
```

```javascript
cy.get('li').eq(1).should('contain', 'siamese') // true
```

## Index Form End

**Find the 2nd from the last element within the elements**

```html
<ul>
  <li>tabby</li>
  <li>siamese</li>
  <li>persian</li>
  <li>sphynx</li>
  <li>burmese</li>
</ul>
```

```javascript
cy.get('li').eq(-2).should('contain', 'sphynx') // true
```

# Command Log

**Find the 4th `<li>` in the navigation**

```javascript
cy.get('.left-nav.nav').find('>li').eq(3)
```

The commands above will display in the command log as:

<img width="532" alt="screen shot 2015-11-27 at 2 11 47 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447231/e225e1f2-9510-11e5-8615-4a5b42ef71c1.png">

When clicking on the `eq` command within the command log, the console outputs the following:

<img width="569" alt="screen shot 2015-11-27 at 2 12 03 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447234/e594ce52-9510-11e5-8794-712a7dbeae55.png">

# See also

- [first](https://on.cypress.io/api/first)
- [last](https://on.cypress.io/api/last)
- [next](https://on.cypress.io/api/next)
- [prev](https://on.cypress.io/api/prev)
