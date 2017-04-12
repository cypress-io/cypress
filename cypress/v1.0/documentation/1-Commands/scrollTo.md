slug: scrollto
excerpt: Scroll to a specific position in the window or another scrollable element

Scroll to a specific position in the window or in the element found in the previous command. The DOM element or window must be in a "scrollable" state prior to the scroll happening.

| | |
|--- | --- |
| **Returns** | the window or DOM element that was scrolled  |
| **Timeout** | `cy.scrollTo` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***
