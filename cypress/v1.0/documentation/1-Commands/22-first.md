slug: first
excerpt: Get the first DOM element within a set of DOM elements

Get the first DOM element within a set of DOM elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.first` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.first()](#section-usage)

Reduce the set of matched DOM elements to the first in the set.

***

# Options

Pass in an options object to change the default behavior of `cy.first`.

**cy.first(*options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry getting the element

***

# Usage

## Get the first list item in a list.

```html
<ul>
  <li class="one">Knick knack on my thumb</li>
  <li class="two">Knick knack on my shoe</li>
  <li class="three">Knick knack on my knee</li>
  <li class="four">Knick knack on my door</li>
</ul>
```

```javascript
// returns <li class="one">Knick knack on my thumb</li>
cy.get("ul").first()
```

***

# Command Log

## Find the first `input` in the `form`

```javascript
cy.get("form").find("input").first()
```

The commands above will display in the command log as:

<img width="527" alt="screen shot 2015-11-29 at 12 28 08 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458770/d9439ee6-9694-11e5-8754-b2641ba44883.png">

When clicking on `first` within the command log, the console outputs the following:

<img width="616" alt="screen shot 2015-11-29 at 12 28 23 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458771/db8cb516-9694-11e5-86c2-cf3bbb9a666d.png">

***

# Related

- [last](https://on.cypress.io/api/last)