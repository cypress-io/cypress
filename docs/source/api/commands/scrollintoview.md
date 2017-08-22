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

## Scrolling

```javascript
cy.get('button#checkout').scrollIntoView()
  .should('be.visible')
```

## Options

***Use linear easing animation to scroll***

```javascript
cy.get('.next-page').scrollIntoView({ easing: 'linear' } )
```

***Scroll to element over 2000ms***

```javascript
cy.get('footer').scrollIntoView({ duration: 2000 })
```

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

***Assert element is visible after scrolling it into view***

```javascript
cy.get('#scroll-horizontal button').scrollIntoView()
  .should('be.visible')
```

The commands above will display in the command log as:

{% img /img/api/scrollintoview/command-log-for-scrollintoview.png "command log scrollintoview" %}

When clicking on the `scrollintoview` command within the command log, the console outputs the following:

{% img /img/api/scrollintoview/console-log-for-scrollintoview.png "console.log scrollintoview" %}

# See also

- {% url `cy.scrollTo()` scrollto %}
