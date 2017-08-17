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

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('footer').scrollIntoView() // Scrolls 'footer' into view
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.scrollIntoView('footer')   // Errors, cannot be chained off 'cy'
cy.window().scrollIntoView()  // Errors, 'window' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.scrollIntoView()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`offset` | `{top: 0, left: 0}` | Amount to scroll after the element has been scrolled into view
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .scrollIntoView %}

## Yields {% helper_icon yields %}

{% yields same_subject .scrollIntoView %}

# Examples

# Notes

## Snapshots

***Snapshots do not reflect scroll behavior***

*Cypress does not reflect the accurate scroll positions of any elements within snapshots.* If you want to see the actual scrolling behavior in action, we recommend using {% url `.pause()` pause %} to walk through each command or {% url 'watching the video of the test run' screenshots-and-videos#Videos %}.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements dom .scrollToIntoView %}

## Assertions {% helper_icon assertions %}

{% assertions wait .scrollToIntoView %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions .scrollToIntoView %}

# Command Log

# See also

- {% url `cy.scrollTo()` scrollto %}
