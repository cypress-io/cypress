slug: siblings
excerpt: Get all siblings DOM elements of the DOM elements

Get the siblings DOM elements of each element in the set of matched DOM elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.siblings` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.siblings()](#usage)

Get the siblings of each DOM element in the set of matched DOM elements.

***

# [cy.siblings( *selector* )](#selector-usage)

Get the siblings of each DOM element in the set of matched DOM elements filtered by a selector.

***

# Options

Pass in an options object to change the default behavior of `cy.siblings`.

**cy.siblings( *options* )**
**cy.siblings( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Usage

## Get the siblings of each li.

```html
<ul>
  <li>Home</li>
  <li>Contact</li>
  <li class="active">Services</li>
  <li>Price</li>
</ul>
```

```javascript
// returns all other li's in list
cy.get(".active").siblings()
```

***

# Selector Usage

## Get siblings of element with class `active`.

```javascript
// returns <li class="active">Services</li>
cy.get("li").siblings(".active")
```

***

# Command Log

## Get the siblings of element with class `active`

```javascript
cy.get(".left-nav").find("li.active").siblings()
```

The commands above will display in the command log as:

<img width="561" alt="screen shot 2015-11-29 at 12 48 55 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458897/a93f2a1e-9697-11e5-8a5b-b131156e1aa4.png">

When clicking on `siblings` within the command log, the console outputs the following:

<img width="429" alt="screen shot 2015-11-29 at 12 49 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458898/ab940fd2-9697-11e5-96ab-a4c34efa3431.png">

***

# Related

- [prev](https://on.cypress.io/api/prev)
- [next](https://on.cypress.io/api/next)
