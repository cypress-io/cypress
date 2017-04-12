slug: prev
excerpt: Get the previous sibling of elements

Get the immediately preceding sibling of each element in the set of the elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.prev` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.prev()](#usage)

Get the immediately preceding sibling of each element in the set of matched elements.

***

# [cy.prev( *selector* )](#selector-usage)

Get the immediately preceding sibling of each element in the set of matched elements filtered by selector.

***

# Options

Pass in an options object to change the default behavior of `cy.prev`.

**cy.prev( *options* )**
**cy.prev( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Find the previous element of the element with class of `active`

```html
<ul>
  <li>Cockatiels</li>
  <li>Lorikeets</li>
  <li class="active">Cockatoos</li>
  <li>Conures</li>
  <li>Eclectus</li>
</ul>
```

```javascript
// returns <li>Lorikeets</li>
cy.get(".active").prev()
```

***

# Selector Usage

## Find the previous element with a class of `active`

```html
<ul>
  <li>Cockatiels</li>
  <li>Lorikeets</li>
  <li class="active">Cockatoos</li>
  <li>Conures</li>
  <li>Eclectus</li>
</ul>
```

```javascript
// returns <li>Cockatoos</li>
cy.get("li").prev(".active")
```

***

# Command Log

## Find the previous element of the active `li`

```javascript
cy.get(".left-nav").find("li.active").prev()
```

The commands above will display in the command log as:

<img width="564" alt="screen shot 2015-11-29 at 12 46 57 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458884/5bb4da1e-9697-11e5-9172-762df10c9a6e.png">

When clicking on `prev` within the command log, the console outputs the following:

<img width="446" alt="screen shot 2015-11-29 at 12 47 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458886/5e20c63c-9697-11e5-9167-1b81f96e1906.png">

***

# Related

1. [next](https://on.cypress.io/api/next)
