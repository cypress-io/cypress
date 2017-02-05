slug: closest
excerpt: Get the closest ancestor DOM element

Get the first DOM element that matches the selector whether it be itself or one of it's ancestors.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.filter` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.closest( *selector* )](#section-selector-usage)

For each DOM element in the set, get the first DOM element that matches the selector by testing the DOM element itself and traversing up through its ancestors in the DOM tree.

***

# Options

Pass in an options object to change the default behavior of `cy.closest`.

**cy.closest( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry getting the element

***

# Selector Usage

## Find the closest element of the current subject with the class `nav`

```javascript
cy.get("li.active").closest(".nav")
```

***

# Command Log

## Find the closest element of the current subject with the class `nav`

```javascript
cy.get("li.active").closest(".nav")
```

The commands above will display in the command log as:

<img width="530" alt="screen shot 2015-11-27 at 2 07 28 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447200/500fe9ca-9510-11e5-8c77-8afb8325d937.png">

When clicking on the `closest` command within the command log, the console outputs the following:

<img width="478" alt="screen shot 2015-11-27 at 2 07 46 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447201/535515c4-9510-11e5-9cf5-088bf21f34ac.png">

***

# Related

- [parents](https://on.cypress.io/api/parents)
- [next](https://on.cypress.io/api/next)
- [first](https://on.cypress.io/api/first)