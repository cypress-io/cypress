slug: prevuntil
excerpt: Get all previous siblings of the DOM elements until another element

Get all previous siblings of each DOM element in the set of matched DOM elements up to, but not including, the element matched by the selector

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.prevUntil` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.prevUntil( *selector* )](#usage)

Get all of the previous siblings of the elements until the selector.

***

# [cy.prevUntil( *selector*, *filter )](#filter-usage)

When a filter is provided, it retrieves all of the previous siblings up until the selector only if it matches that filter.

***

# [cy.prevUntil( *element* )](#element-usage)

Get all of the previous siblings of the elements until the DOM node or jQuery object.

***

# [cy.prevUntil( *element*, *filter )](#element-filter-usage)

When a filter is provided, it retrieves all of the previous siblings up until the DOM node or jQuery object only if it matches that filter.

***

# Options

Pass in an options object to change the default behavior of `cy.prevUntil`.

**cy.prevUntil( *selector*, *options* )**
**cy.prevUntil( *selector*, *filter*, *options* )**
**cy.prevUntil( *element*, *options* )**
**cy.prevUntil( *element*, *filter*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Find all of the element's siblings before `#nuts` until `#veggies`

```html
<ul>
  <li id="fruits" class="header">Fruits</li>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li id="veggies" class="header">Vegetables</li>
  <li>cucumbers</li>
  <li>carrots</li>
  <li>corn</li>
  <li id="nuts" class="header">Nuts</li>
  <li>walnuts</li>
  <li>cashews</li>
  <li>almonds</li>
</ul>
```

```javascript
//returns [<li>cucumbers</li>, <li>carrots</li>, <li>corn</li>]
cy.get("#nuts").nextUntil("#veggies")
```

***

# Command Log

## Find all of the element's siblings before `#nuts` until `#veggies`

```javascript
cy.get("#nuts").nextUntil("#veggies")
```

The commands above will display in the command log as:

<img width="560" alt="screen shot 2017-03-23 at 2 45 30 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264621/69ed829c-0fd7-11e7-934d-c11157c36aca.png">

When clicking on `prevUntil` within the command log, the console outputs the following:

<img width="560" alt="screen shot 2017-03-23 at 2 45 36 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264632/7743f57a-0fd7-11e7-99f8-c148acd17459.png">

***

# Related

- [prev](https://on.cypress.io/api/prev)
- [prevAll](https://on.cypress.io/api/prevall)
- [parentsUntil](https://on.cypress.io/api/parentsuntil)
- [nextUntil](https://on.cypress.io/api/nextuntil)
