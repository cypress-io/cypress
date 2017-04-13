slug: scrollintoview
excerpt: Scroll an element into view

Scroll an element into view.

| | |
|--- | --- |
| **Returns** | the element that was scrolled into view  |
| **Timeout** | `cy.scrollIntoView` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |


***

# [cy.scrollIntoView()](#section-usage)

Scroll to the element found in the previous command into view.

***


# Options

Pass in an options object to change the default behavior of `cy.scrollIntoView`.

**[cy.scrollIntoView( *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`duration` | `0` | Scrolls over the duration (in ms)
`easing` | `swing` | Will scroll with the easing animation
`offset` | `{top: 0, left: 0}` | Amount to scroll after the element has been scrolled into view
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry the scroll
`log` | `true` | whether to display command in command log

***

# Usage

***

# Options Usage

***

# Notes

## Snapshots

***

# Command Log

***

# Related

- [scrollTo](https://on.cypress.io/api/scrollto)
