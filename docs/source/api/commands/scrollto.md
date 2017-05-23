---
title: scrollto
comments: true
description: ''
---

Scroll to a specific position in the window or in the element found in the previous command. The DOM element or window must be in a "scrollable" state prior to the scroll happening.

| | |
|--- | --- |
| **Returns** | the window or DOM element that was scrolled  |
| **Timeout** | `cy.scrollTo` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

# [cy.scrollTo( *position* )](#position-usage)

Scroll to a specific position in the window or in the element found in the previous command. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

![cypress-command-positions-diagram](https://cloud.githubusercontent.com/assets/1271364/25048528/fe0c6378-210a-11e7-96bc-3773f774085b.jpg)

# [cy.scrollTo( *x*, *y* )](#coordinate-usage)

You can pass an `x` and `y` coordinate in pixels which will calculate the distance from the top left corner of the element and scroll to the calculated coordinate. The coordinates can be a number or a string with 'px'.

# [cy.scrollTo( *width %*, *height %* )](#percentage-usage)

You can pass a string with the percentage of the element's width and height to scroll to that position.

# Options

Pass in an options object to change the default behavior of `cy.scrollTo`.

**[cy.scrollTo( *position*, *options* )](#options-usage)**
**[cy.scrollTo( *x*, *y*, *options* )](#options-usage)**
**[cy.scrollTo( *width %*, *height %*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry the scroll
`log` | `true` | whether to display command in command log

# Position Usage

## Scroll to the bottom of the window

```javascript
cy.scrollTo('bottom')
```

## Scroll to the center of the list

```javascript
cy.get('#movies-list').scrollTo('center')
```

# Coordinate Usage

## Scroll 500px down the list

```javascript
cy.get('#infinite-scroll-list').scrollTo(0, 500)
```

## Scroll the window 500px to the right

```javascript
cy.scrollTo('500px')
```

# Percentage Usage

## Scroll 25% down the element

```javascript
 cy.get('.user-photo').scrollTo('0%', '25%')
```

# Options Usage

## Use linear easing animation to scroll

```javascript
cy.get('.documentation').scrollTo('top', { easing: 'linear'} )
```

## Scroll to the right over 2000ms

```javascript
cy.get('#slider').scrollTo('right', { duration: 2000} )
```

# Notes

## Snapshots

**Cypress does not reflect the accurate scroll positions of any elements within snapshots.** If you want to see the actual scrolling behavior in action, we recommend using [`cy.pause()`](https://on.cypress.io/api/pause) to walk through each command or [watching the video of the test run](#https://on.cypress.io/guides/runs#videos).

# Command Log

## Scroll to the bottom of the window then scroll the element to the "right"

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
