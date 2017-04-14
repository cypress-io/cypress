slug: scrollto
excerpt: Scroll to a specific position in the window or another scrollable element

Scroll to a specific position in the window or in the element found in the previous command. The DOM element or window must be in a "scrollable" state prior to the scroll happening.

| | |
|--- | --- |
| **Returns** | the window or DOM element that was scrolled  |
| **Timeout** | `cy.scrollTo` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |


***

# [cy.scrollTo( *position* )](#section-position-usage)

Scroll to a specific position in the window or in the element found in the previous command. Valid positions are `topLeft`, `top`, `topRight`, `left`, `center`, `right`, `bottomLeft`, `bottom`, and `bottomRight`.

![cypress-command-positions-diagram](https://cloud.githubusercontent.com/assets/1271364/25048528/fe0c6378-210a-11e7-96bc-3773f774085b.jpg)

***

# [cy.scrollTo( *x*, *y* )](#section-coordinate-usage)

You can pass an `x` and `y` coordinate in pixels which will calculate the distance from the top left corner of the element and scroll to the calculated coordinate. The coordinates can be a number or a string with 'px'.

***

# [cy.scrollTo( *width %*, *height %* )](#section-percentage-usage)

You can pass a string with the percentage of the element's width and height to scroll to that position.


***


# Options

Pass in an options object to change the default behavior of `cy.scrollTo`.

**[cy.scrollTo( *position*, *options* )](#options-usage)**
**[cy.scrollTo( *x*, *y*, *options* )](#options-usage)**
**[cy.scrollTo( *width %*, *height %*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry the scroll
`log` | `true` | whether to display command in command log

***

# Position Usage

***

# Coordinate Usage

***

# Options Usage

***

# Notes

## Snapshots

***

# Command Log

***

# Related

- [scrollIntoView](https://on.cypress.io/api/scrollintoview)
