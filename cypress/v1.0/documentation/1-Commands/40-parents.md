slug: parents
excerpt: Get the parents DOM elements of the DOM elements

Get the parents DOM elements of the DOM elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.parents` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.parents()](#usage)

Get the ancestors of each element in the current set of matched elements.

***

# [cy.parents( *selector* )](#selector-usage)

Get the ancestors of each element in the current set of matched elements filtered by selector

***

# Options

Pass in an options object to change the default behavior of `cy.parents`.

**cy.parents( *options* )**
**cy.parents( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Get the parents of the active `li`

```javascript
cy.get("li.active").parents()
```

***

# Selector Usage

## Get the parents with class `nav` of the active `li`

```javascript
cy.get("li.active").parents(".nav")
```

***

# Command Log

## Get the parents of the active `li`

```javascript
cy.get("li.active").parents()
```

<img width="531" alt="screen shot 2015-11-27 at 2 02 59 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447168/be286244-950f-11e5-82e8-9a2a6d1d08e8.png">

When clicking on the `parents` command within the command log, the console outputs the following:

<img width="537" alt="screen shot 2015-11-27 at 2 03 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447171/c1ba5ef8-950f-11e5-9f2d-7fbd0b142649.png">

***

# Related

- [parent](https://on.cypress.io/api/parent)
- [children](https://on.cypress.io/api/children)
