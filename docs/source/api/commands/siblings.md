---
title: siblings
comments: true
---

Get sibling DOM elements.

# Syntax

```javascript
.siblings()
.siblings(selector)
.siblings(options)
.siblings(selector, options)
```

## Usage

`.siblings()` requires being chained off another cy command that *yields* a DOM element or DOM elements.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('td').siblings()           // Yield all td's siblings
cy.get('li').siblings('.active')  // Yield all li's siblings with class '.active'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.siblings('.error')     // Errors, cannot be chained off 'cy'
cy.location().siblings()  // Errors, 'location' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.siblings()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.siblings()` yields the new DOM elements found by the command.

## Timeout

`.siblings()` will continue to look for the sibling element(s) for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Siblings

**Get the siblings of each li**

```html
<ul>
  <li>Home</li>
  <li>Contact</li>
  <li class="active">Services</li>
  <li>Price</li>
</ul>
```

```javascript
// yields all other li's in list
cy.get('.active').siblings()
```

## Selector

**Get siblings of element with class `active`**

```javascript
// yields <li class="active">Services</li>
cy.get('li').siblings('.active')
```

# Command Log

**Get the siblings of element with class `active`**

```javascript
cy.get('.left-nav').find('li.active').siblings()
```

The commands above will display in the command log as:

<img width="561" alt="screen shot 2015-11-29 at 12 48 55 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458897/a93f2a1e-9697-11e5-8a5b-b131156e1aa4.png">

When clicking on `siblings` within the command log, the console outputs the following:

<img width="429" alt="screen shot 2015-11-29 at 12 49 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458898/ab940fd2-9697-11e5-96ab-a4c34efa3431.png">

# See also

- {% url `.prev()` prev %}
- {% url `.next()` next %}
