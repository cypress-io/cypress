slug: nextall
excerpt: Get all following siblings of the DOM elements

Get all following siblings of each DOM element in the set of matched DOM elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.nextAll` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.nextAll()](#usage)

Get all of the next siblings of the elements.

***

# [cy.nextAll( *selector* )](#selector-usage)

When a selector is provided, it retrieves all of the following siblings only if it matches that selector.

***

# Options

Pass in an options object to change the default behavior of `cy.nextAll`.

**cy.nextAll( *options* )**
**cy.nextAll( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Find all of the element's siblings following `.second`

```html
<ul>
  <li>apples</li>
  <li class="second">oranges</li>
  <li>bananas</li>
  <li>pineapples</li>
  <li>grapes</li>
</ul>
```

```javascript
//returns [<li>bananas</li>, <li>pineapples</li>, <li>grapes</li>]
cy.get(".second").nextAll()
```

***

# Selector Usage

## Find all of the following siblings of each li. Keep only the ones with a class `selected`.

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
cy.get("li").nextAll(".selected")
```

***

# Command Log

## Find all elements following the active li

```javascript
cy.get(".left-nav").find("li.active").nextAll()
```

The commands above will display in the command log as:

<img width="560" alt="screen shot 2017-03-23 at 2 05 32 pm" src="https://cloud.githubusercontent.com/assets/1271364/24262886/e1513334-0fd1-11e7-93b1-b413a9390828.png">

When clicking on `nextAll` within the command log, the console outputs the following:

<img width="567" alt="screen shot 2017-03-23 at 2 05 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/24262907/f2b7fe78-0fd1-11e7-921c-6eabf6e32abb.png">

***

# Related

- [next](https://on.cypress.io/api/next)
- [nextUntil](https://on.cypress.io/api/nextuntil)
- [prevAll](https://on.cypress.io/api/prevall)
