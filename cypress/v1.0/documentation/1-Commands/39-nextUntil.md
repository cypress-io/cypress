slug: nextuntil
excerpt: Get all following siblings of the DOM elements until another element

Get all following siblings of each DOM element in the set of matched DOM elements up to, but not including, the element matched by the selector

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.nextUntil` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.nextUntil( *selector* )](#usage)

Get all of the next siblings of the elements until the selector.

***

# [cy.nextUntil( *selector*, *filter )](#filter-usage)

When a filter is provided, it retrieves all of the following siblings up until the selector only if it matches that filter.

***

# [cy.nextUntil( *element* )](#element-usage)

Get all of the next siblings of the elements until the DOM node or jQuery object.

***

# [cy.nextUntil( *element*, *filter )](#element-filter-usage)

When a filter is provided, it retrieves all of the following siblings up until the DOM node or jQuery object only if it matches that filter.

***

# Options

Pass in an options object to change the default behavior of `cy.nextUntil`.

**cy.nextUntil( *selector*, *options* )**
**cy.nextUntil( *selector*, *filter*, *options* )**
**cy.nextUntil( *element*, *options* )**
**cy.nextUntil( *element*, *filter*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Find all of the element's siblings following `#veggies` until `#nuts`

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
cy.get("#veggies").nextUntil("#nuts")
```

***

# Command Log

## Find all of the element's siblings following `#veggies` until `#nuts`

```javascript
cy.get("#veggies").nextUntil("#nuts")
```

The commands above will display in the command log as:

<img width="563" alt="screen shot 2017-03-23 at 2 17 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/24263453/96a8c0b6-0fd3-11e7-8a66-da9177ca94a7.png">

When clicking on `nextUntil` within the command log, the console outputs the following:

<img width="514" alt="screen shot 2017-03-23 at 2 18 01 pm" src="https://cloud.githubusercontent.com/assets/1271364/24263481/a20ce2f2-0fd3-11e7-881c-f6bf8d652263.png">

***

# Related

- [next](https://on.cypress.io/api/next)
- [nextAll](https://on.cypress.io/api/nextall)
- [prevUntil](https://on.cypress.io/api/prevuntil)
