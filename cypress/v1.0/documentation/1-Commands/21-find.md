slug: find
excerpt: Get descendants of DOM elements

Get the descendents DOM elements of a specific selector.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.find` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.find( *selector* )](#selector-usage)

Get the descendants of each DOM element in the current set of matched DOM elements within the selector.

***

# Options

Pass in an options object to change the default behavior of `cy.find`.

**cy.find( *selector*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Selector Usage

## Get li's within parent

```html
<ul id="parent">
  <li class="first"></li>
  <li class="second"></li>
</ul>
```

```javascript
// returns [<li class="first"></li>, <li class="second"></li>]
cy.get("#parent").find("li")
```

***

# Command Log

## Find the `li`'s within the nav

```javascript
cy.get(".left-nav>.nav").find(">li")
```

The commands above will display in the command log as:

<img width="522" alt="screen shot 2015-11-27 at 2 19 38 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447309/f6a9be4a-9511-11e5-84a5-a111215bf1e6.png">

When clicking on the `find` command within the command log, the console outputs the following:

<img width="516" alt="screen shot 2015-11-27 at 2 19 54 pm" src="https://cloud.githubusercontent.com/assets/1271364/11447312/fa3679cc-9511-11e5-9bea-904f8c70063d.png">

***

# Related

- [get](https://on.cypress.io/api/get)
