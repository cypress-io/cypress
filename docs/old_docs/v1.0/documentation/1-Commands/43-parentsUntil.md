slug: parentsuntil
excerpt: Get all ancestors of the DOM elements until another element

Get all ancestors of each DOM element in the set of matched DOM elements up to, but not including, the element matched by the selector

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.parentsUntil` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.parentsUntil( *selector* )](#usage)

Get all of the ancestors of the elements until the selector.

***

# [cy.parentsUntil( *selector*, *filter )](#filter-usage)

When a filter is provided, it retrieves all of the ancestors up until the selector only if it matches that filter.

***

# [cy.parentsUntil( *element* )](#element-usage)

Get all of the ancestors of the elements until the DOM node or jQuery object.

***

# [cy.parentsUntil( *element*, *filter )](#element-filter-usage)

When a filter is provided, it retrieves all of the ancestors up until the DOM node or jQuery object only if it matches that filter.

***

# Options

Pass in an options object to change the default behavior of `cy.parentsUntil`.

**cy.parentsUntil( *selector*, *options* )**
**cy.parentsUntil( *selector*, *filter*, *options* )**
**cy.parentsUntil( *element*, *options* )**
**cy.parentsUntil( *element*, *filter*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Find all of the `.active` element's ancestors until `.nav`

```html
<ul class="nav">
  <li>
    <a href="#">Clothes</a>
    <ul class="menu">
      <li>
        <a href="/shirts">Shirts</a>
      </li>
      <li class="active">
        <a href="/pants">Pants</a>
      </li>
    </ul>
  </li>
</ul>
```

```javascript
//returns [ul.menu, li]
cy.get(".active").parentsUntil(".nav")
```

***

# Command Log

## Find all of the `.active` element's ancestors until `.nav`

```javascript
cy.get(".active").parentsUntil(".nav")
```

The commands above will display in the command log as:

<img width="561" alt="screen shot 2017-03-23 at 2 37 31 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264301/516d5fd6-0fd6-11e7-9ab7-b55b211acde3.png">

When clicking on `parentsUntil` within the command log, the console outputs the following:

<img width="523" alt="screen shot 2017-03-23 at 2 37 39 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264309/60cc75de-0fd6-11e7-97b4-d0aa184b0ba6.png">

***

# Related

- [parent](https://on.cypress.io/api/parent)
- [parents](https://on.cypress.io/api/parents)
- [prevUntil](https://on.cypress.io/api/prevuntil)
- [nextUntil](https://on.cypress.io/api/nextuntil)
