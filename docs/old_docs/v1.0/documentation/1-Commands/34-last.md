slug: last
excerpt: Get the last DOM element

Get the last DOM element within a set of DOM elements.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.last` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) |

***

# [cy.last()](#section-usage)

Reduce the set of matched DOM elements to the final one in the set.

***

# Options

Pass in an options object to change the default behavior of `cy.last`.

**cy.last( *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to retry getting the element

***

# Usage

## Get the last list item in a list.

```html
<ul>
  <li class="one">Knick knack on my thumb</li>
  <li class="two">Knick knack on my shoe</li>
  <li class="three">Knick knack on my knee</li>
  <li class="four">Knick knack on my door</li>
</ul>
```

```javascript
// returns <li class="four">Knick knack on my door</li>
cy.get("ul").last()
```

***

# Command Log

## Find the last button in the form

```javascript
cy.get("form").find("button").last()
```

The commands above will display in the command log as:

<img width="560" alt="screen shot 2015-11-29 at 12 33 52 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458797/8e9abdf6-9695-11e5-8594-7044751d5199.png">

When clicking on `last` within the command log, the console outputs the following:

<img width="746" alt="screen shot 2015-11-29 at 12 34 07 pm" src="https://cloud.githubusercontent.com/assets/1271364/11458799/91a115cc-9695-11e5-8569-93fbaa2704d4.png">

***

# Related

- [first](https://on.cypress.io/api/first)