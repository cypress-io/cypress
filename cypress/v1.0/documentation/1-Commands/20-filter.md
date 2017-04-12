slug: filter
excerpt: Filter DOM elements by a selector

Get DOM elements that match a specific selector. Opposite of [`cy.not()`](https://on.cypress.io/api/not)

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.filter` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.filter( *selector* )](#selector-usage)

Reduce the set of matched DOM elements to those that match the selector.

***

# Options

Pass in an options object to change the default behavior of `cy.filter`.

**cy.filter( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Selector Usage

## Filter the current subject to the element with the class `active`.

```html
<ul>
  <li>Home</li>
  <li class="active">About</li>
  <li>Services</li>
  <li>Pricing</li>
  <li>Contact</li>
</ul>
```

```javascript
// returns <li>About</li>
cy.get("ul").find(">li").filter(".active")
```

***

# Command Log

## Filter the `li`'s to the `li` with the class `active`.

```javascript
cy.get(".left-nav>.nav").find(">li").filter(".active")
```

The commands above will display in the command log as:

<img width="522" alt="screen shot 2015-11-27 at 2 15 53 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447263/7176e824-9511-11e5-93cc-fa10b3b94482.png">

When clicking on the `filter` command within the command log, the console outputs the following:

<img width="503" alt="screen shot 2015-11-27 at 2 16 09 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447266/74b643a4-9511-11e5-8b42-6f6dfbdfb2a8.png">

# Related

- [not](https://on.cypress.io/api/not)
