---
title: scrollTo
comments: true
---

Scroll to a specific position.

# Syntax

```javascript
cy.scrollTo(position)
cy.scrollTo(x, y)
cy.scrollTo(position, options)
cy.scrollTo(x, y, options)
```

## Usage

`cy.scrollTo()` can be chained off of `cy` to scroll to a position in the window or chained off another cy command that *yields* a DOM element - limiting scrolling to it's yielded element.

```javascript
cy.scrollTo(0, 500)                     // Scroll the window 500px down
cy.get('.sidebar').scrollTo('bottom')   // Scroll 'sidebar' to it's bottom
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.title().scrollTo('My App')  // Errors, 'title' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} position** ***(String)***

A specified position to scroll the window or element to. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

![cypress-command-positions-diagram](https://cloud.githubusercontent.com/assets/1271364/25048528/fe0c6378-210a-11e7-96bc-3773f774085b.jpg)

**{% fa fa-angle-right %} x** ***(Number, String)***

The distance in pixels from window/element's left or percentage of the window/element's width to scroll to.

**{% fa fa-angle-right %} y** ***(Number, String)***

The distance in pixels from window/element's top or percentage of the window/element's height to scroll to.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.scrollTo()`.

Option | Default | Notes
--- | --- | ---
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`log` | `true` | Whether to display command in Command Log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the scroll

## Yields

`cy.scrollTo()` yields the window or DOM element that was scrolled.

## Timeout

`cy.scrollTo()` will wait until the window or element is in a 'scrollable' state for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's options.

# Examples

## Position

**Scroll to the bottom of the window**

```javascript
cy.scrollTo('bottom')
```

**Scroll to the center of the list**

```javascript
cy.get('#movies-list').scrollTo('center')
```

## Coordinates

**Scroll 500px down the list**

```javascript
cy.get('#infinite-scroll-list').scrollTo(0, 500)
```

**Scroll the window 500px to the right**

```javascript
cy.scrollTo('500px')
```

**Scroll 25% down the element's height**

```javascript
 cy.get('.user-photo').scrollTo('0%', '25%')
```

## Options

**Use linear easing animation to scroll**

```javascript
cy.get('.documentation').scrollTo('top', { easing: 'linear'} )
```

**Scroll to the right over 2000ms**

```javascript
cy.get('#slider').scrollTo('right', { duration: 2000} )
```

# Notes

**Snapshots do not reflect scroll behavior**

*Cypress does not reflect the accurate scroll positions of any elements within snapshots.* If you want to see the actual scrolling behavior in action, we recommend using [`cy.pause()`](https://on.cypress.io/api/pause) to walk through each command or [watching the video of the test run](#https://on.cypress.io/guides/runs#videos).

# Command Log

**Scroll to the bottom of the window then scroll the element to the "right"**

```javascript
cy.scrollTo('bottom')
cy.get('#scrollable-horizontal').scrollTo('right')
```

The commands above will display in the command log as:

<img width="529" alt="screen shot 2017-04-14 at 12 29 13 pm" src="https://cloud.githubusercontent.com/assets/1271364/25049157/50d68f18-210e-11e7-81f1-ed837075160d.png">

When clicking on `scrollTo` within the command log, the console outputs the following:

<img width="788" alt="screen shot 2017-04-14 at 12 32 16 pm" src="https://cloud.githubusercontent.com/assets/1271364/25049182/6e07211a-210e-11e7-9419-b57f3e08a608.png">

# See also

- [scrollIntoView](https://on.cypress.io/api/scrollintoview)
