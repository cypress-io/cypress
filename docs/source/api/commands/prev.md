---
title: prev
comments: false
---

Get the immediately preceding sibling of each element in a set of the elements.

# Syntax

```javascript
.prev()
.prev(selector)
.prev(options)
.prev(selector, options)
```

## Usage

`.prev()` requires being chained off another cy command that *yields* a DOM element or set of DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('tr.highlight').prev() // Yield previous 'tr'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.prev()                // Errors, cannot be chained off 'cy'
cy.getCookies().prev()   // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.prev()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the element

## Yields

`.prev()` yields the new DOM element(s) found by the command.

## Timeout

`.prev()` will continue to look for the previous element for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Previous

**Find the previous element of the element with class of `active`**

```html
<ul>
  <li>Cockatiels</li>
  <li>Lorikeets</li>
  <li class="active">Cockatoos</li>
  <li>Conures</li>
  <li>Eclectus</li>
</ul>
```

```javascript
// yields <li>Lorikeets</li>
cy.get('.active').prev()
```

## Selector

**Find the previous element with a class of `active`**

```html
<ul>
  <li>Cockatiels</li>
  <li>Lorikeets</li>
  <li class="active">Cockatoos</li>
  <li>Conures</li>
  <li>Eclectus</li>
</ul>
```

```javascript
// yields <li>Cockatoos</li>
cy.get('li').prev('.active')
```

# Command Log

**Find the previous element of the active `li`**

```javascript
cy.get('.left-nav').find('li.active').prev()
```

The commands above will display in the command log as:

<img width="564" alt="screen shot 2015-11-29 at 12 46 57 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458884/5bb4da1e-9697-11e5-9172-762df10c9a6e.png">

When clicking on `prev` within the command log, the console outputs the following:

<img width="446" alt="screen shot 2015-11-29 at 12 47 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458886/5e20c63c-9697-11e5-9167-1b81f96e1906.png">

# See also

- {% url `.next()` next %}
- {% url `.prevAll()` prevall %}
- {% url `.prevUntil()` prevuntil %}
