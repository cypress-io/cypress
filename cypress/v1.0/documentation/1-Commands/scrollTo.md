slug: scrollto
excerpt: Scroll to a specific position in the window or another scrollable element

Scroll to a specific position in the window or in the element found in the previous command. The DOM element or window must be in a "scrollable" state prior to the scroll happening.

| | |
|--- | --- |
| **Returns** | the window or DOM element that was scrolled  |
| **Timeout** | `cy.scrollTo` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |


***

# [cy.scrollTo( *position* )](#section-text-usage)

Scroll to a specific positin in the window or in the element found in the previous command.


Position | Notes
--- | ---
`topLeft` | Scrolls to the top left corner of the element
`top` | Scrolls to the top center of the element
`topRight` | Scrolls to the top right corner of the element
`left` | Scrolls to left center of the element
`center` | Scrolls to the exact center of the element
`right` | Scrolls to the right center of the element
`bottomLeft` | Scrolls to the bottom left corner of the element
`bottom` | Scrolls to the bottom center of the element
`bottomRight` | Scrolls to the bottom right corner of the element

***

# [cy.scrollTo( *x*, *y* )](#section-number-usage)

You can pass a relative `x` and `y` coordinate which will calculate distance the distance from the top left corner of the element and scroll to the calculated coordinate.

x and y can be a number or percentage

***


# Options

Pass in an options object to change the default behavior of `cy.scrollTo`.

**[cy.scrollTo( *position*, *options* )](#options-usage)**
**[cy.scrollTo( *x*, *y*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry the scroll
`log` | `true` | whether to display command in command log

***
