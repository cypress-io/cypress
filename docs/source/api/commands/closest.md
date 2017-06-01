---
title: closest
comments: true
description: ''
---

Get the first DOM element that matches the selector (whether it be itself or one of it's ancestors).

# Syntax

```javascript
.closest(selector)
.closest(selector, options)
```

## Usage

`.closest()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('td').closest('.filled') // Yield closest el with class '.filled'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.closest('.active')  // Errors, cannot be chained off 'cy'
cy.url().closest()     // Errors, 'url' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} selector**  ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.closest()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

## Yields

`.closest()` yields the new DOM elements found by the command.

## Timeout

`.closest()` will continue to look for the closest element for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts).

# Examples

## Closest

**Find the closest element of the 'error' with the class 'banner'**

```javascript
cy.get('p.error').closest('.banner')
```

# Command Log

**Find the closest element of 'active li' with the class 'nav'**

```javascript
cy.get('li.active').closest('.nav')
```

The commands above will display in the command log as:

<img width="530" alt="screen shot 2015-11-27 at 2 07 28 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447200/500fe9ca-9510-11e5-8c77-8afb8325d937.png">

When clicking on the `closest` command within the command log, the console outputs the following:

<img width="478" alt="screen shot 2015-11-27 at 2 07 46 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447201/535515c4-9510-11e5-9cf5-088bf21f34ac.png">

# See also

- [first](https://on.cypress.io/api/first)
- [parent](https://on.cypress.io/api/parent)
- [parents](https://on.cypress.io/api/parents)
- [parentsUntil](https://on.cypress.io/api/parentsUntil)
- [prev](https://on.cypress.io/api/prev)
- [prevAll](https://on.cypress.io/api/prevAll)
- [prevUntil](https://on.cypress.io/api/prevUntil)
