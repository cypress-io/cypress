slug: not
excerpt: Remove DOM elements from the set of DOM elements

Remove DOM elements from the set of DOM elements. Opposite of [`cy.filter()`](https://on.cypress.io/api/filter)

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.not` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.not( *selector* )](#selector-usage)

Remove the element(s) by it's selector from the elements

***

# Options

Pass in an options object to change the default behavior of `cy.not`.

**cy.not( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Selector Usage

## Filter the current subject to the elements that do not have class `active`.

```javascript
cy.get(".left-nav>.nav").find(">li").not(".active")
```

***

# Command Log

## Find all buttons that are not of type submit

```javascript
cy.get("form").find("button").not("[type='submit']")
```

The commands above will display in the command log as:

<img width="572" alt="screen shot 2015-11-29 at 12 36 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458817/0a846c3c-9696-11e5-9901-5f4376629e75.png">

When clicking on `not` within the command log, the console outputs the following:

<img width="689" alt="screen shot 2015-11-29 at 12 37 39 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458819/0d6870f6-9696-11e5-9364-2685b8ffc71b.png">

***
# Related

- [filter](https://on.cypress.io/api/filter)
