---
title: scrollIntoView
comments: false
---

Scroll an element into view.


# Syntax

```javascript
.scrollIntoView()
.scrollIntoView(options)
```

## Usage

`.scrollIntoView()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('footer').scrollIntoView() // Scrolls 'footer' into view
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.scrollIntoView('footer')   // Errors, cannot be chained off 'cy'
cy.window().scrollIntoView()  // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.scrollIntoView()`.

Option | Default | Notes
--- | --- | ---
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`log` | `true` | Whether to display command in Command Log
`offset` | `{top: 0, left: 0}` | Amount to scroll after the element has been scrolled into view
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry the scroll

## Yields

`.scrollIntoView()` yields the DOM element that was scrolled into view.

## Timeout

`.scrollIntoView()` will continue to scroll the element into view for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

# Notes

**Snapshots do not reflect scroll behavior**

*Cypress does not reflect the accurate scroll positions of any elements within snapshots.* If you want to see the actual scrolling behavior in action, we recommend using {% url `.pause()` pause %} to walk through each command or [watching the video of the test run](#https://on.cypress.io/guides/runs#videos).

# Command Log

# See also

- {% url `cy.scrollTo()` scrollto %}
