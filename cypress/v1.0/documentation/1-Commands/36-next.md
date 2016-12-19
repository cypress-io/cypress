slug: next
excerpt: Get the next sibling of the DOM elements

Get the immediately following sibling of each DOM element in the set of matched DOM elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.next` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.next()](#section-usage)

Get the next sibling of the elements.

***

# [cy.next( *selector* )](#section-selector-usage)

When a selector is provided, it retrieves the next sibling only if it matches that selector.

***

# Options

Pass in an options object to change the default behavior of `cy.next`.

**cy.next( *options* )**
**cy.next( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry getting the element

***

# Usage

## Find the element next to `.second`

```html
<ul>
  <li>apples</li>
  <li class="second">oranges</li>
  <li>bananas</li>
</ul>
```

```javascript
//returns <li>bananas</li>
cy.get(".second").next()
```

***

# Selector Usage

## Find the very next sibling of each li. Keep only the ones with a class `selected`.

```html
<ul>
  <li>apples</li>
  <li>oranges</li>
  <li>bananas</li>
  <li class="selected">pineapples</li>
</ul>
```

```javascript
//returns <li>pineapples</li>
cy.get("li").next(".selected")
```

***

# Command Log

## Find the element next to the active li

```javascript
cy.get(".left-nav").find("li.active").next()
```

The commands above will display in the command log as:

<img width="563" alt="screen shot 2015-11-29 at 12 42 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458857/afcfddf2-9696-11e5-9405-0cd994f70d45.png">

When clicking on `next` within the command log, the console outputs the following:

<img width="547" alt="screen shot 2015-11-29 at 12 42 22 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458858/b30b0a0a-9696-11e5-99b9-d785b597287c.png">

***

# Related

- [prev](https://on.cypress.io/api/prev)