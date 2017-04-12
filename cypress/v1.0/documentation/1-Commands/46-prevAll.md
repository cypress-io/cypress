slug: prevAll
excerpt: Get all previous siblings of the DOM elements

Get all previous siblings of each DOM element in the set of matched DOM elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.prevAll` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.prevAll()](#usage)

Get all of the next siblings of the elements.

***

# [cy.prevAll( *selector* )](#selector-usage)

When a selector is provided, it retrieves all of the previous siblings only if it matches that selector.

***

# Options

Pass in an options object to change the default behavior of `cy.prevAll`.

**cy.prevAll( *options* )**
**cy.prevAll( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Find all of the element's siblings before `.third`

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li class="third">bananas</li>
  <li>pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
//returns [<li>apples</li>, <li>oranges</li>]
cy.get(".third").prevAll()
```

***

# Selector Usage

## Find all of the previous siblings of each li. Keep only the ones with a class `selected`.

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li class="selected">pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
//returns <li>pineapples</li>
cy.get("li").prevAll(".selected")
```

***

# Command Log

## Find all elements before the active li

```javascript
cy.get(".left-nav").find("li.active").prevAll()
```

The commands above will display in the command log as:

<img width="562" alt="screen shot 2017-03-23 at 2 50 20 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264885/1a1d87ac-0fd8-11e7-97cb-1d0d2110de81.png">

When clicking on `prevAll` within the command log, the console outputs the following:

<img width="539" alt="screen shot 2017-03-23 at 2 50 26 pm" src="https://cloud.githubusercontent.com/assets/1271364/24264898/2219d1a4-0fd8-11e7-9e8b-6b2d97166d6a.png">

***

# Related

- [prev](https://on.cypress.io/api/prev)
- [prevUntil](https://on.cypress.io/api/prevuntil)
- [nextAll](https://on.cypress.io/api/nextall)
