slug: get
excerpt: Get DOM element(s) by selector or alias

Get one or more DOM elements by selector or [alias](https://on.cypress.io/guides/using-aliases).

`cy.get` supports all CSS based selectors. It is analogous to jQuery's `$(...)` in that any selector you pass to jQuery you can also pass to `cy.get`.

| | |
|--- | --- |
| **Returns** | the new DOM element(s) found by the command. |
| **Timeout** | `cy.get` will retry for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) |

***

# [cy.get( *selector* )](#selector-usage)

Finds one or more DOM elements based on the selector.

***

# [cy.get( *alias* )](#alias-usage)

[block:callout]
{
  "type": "info",
  "body": "[Read about using aliases first.](https://on.cypress.io/guides/using-aliases)",
  "title": "New to Cypress?"
}
[/block]

You can pass in the `@` character and the name of an alias as a parameter to find an [aliased](https://on.cypress.io/guides/using-aliases) element.

Internally Cypress keeps a cache of all aliased elements.  If the element currently exists in the DOM, it is immediately returned.  If the element no longer exists, Cypress will re-query the element based on the previous selector path to find it again.

***

# Options

Pass in an options object to change the default behavior of `cy.get`.

**cy.get( *selector*, *options* )**
**cy.get( *alias*, *options* )**

Option | Default | Notes
--- | --- | ---
`log` | `true` | whether to display command in command log
`timeout` | [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to retry getting the element

***

# Selector Usage

## Find the element with an id of main

```javascript
cy.get("#main")
```

***

## Find the first `li` descendent within a `ul`

```javascript
cy.get("ul li:first")
```

***

## Find the element with class dropdown-menu and click it.

```javascript
cy
  .get(".dropdown-menu").click()

  // Break out of the previous command chain and
  // query for #search from the root document.
  .get("#search").type("mogwai")
```

***

## Reset the current scope in a [`cy.within`](https://on.cypress.io/api/within)

```javascript
// Find form and scope all new queries to within form.
cy.get("form").within(function(){
  cy
    // Find the input within form and type Pamela
    .get("input").type("Pamela")
    // Find the element textarea within form and type in it
    .get("textarea").type("is a developer")
})
```

***

# Alias Usage

For a detailed explanation of aliasing, [read more about aliasing here](https://on.cypress.io/guides/using-aliases).

## Retrieve aliased `todos` elements

```javascript
cy.get("ul#todos").as("todos")

//...hack hack hack...

//later retrieve the todos
cy.get("@todos")
```

***

## Alias the `submitBtn` in a `beforeEach`

```javascript
beforeEach(function(){
  cy.get("button[type=submit]").as("submitBtn")
})

it("disables on click", function(){
  cy.get("@submitBtn").should("be.disabled")
})
```

***


# Command Log

## Get an input and assert on the value

```javascript
cy
  .get("input[name='firstName']")
  .should("have.value", "Homer")
```

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 24 20 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446808/5d2f2180-950a-11e5-8645-4f0f14321f86.png">

When clicking on the `get` command within the command log, the console outputs the following:

<img width="543" alt="screen shot 2015-11-27 at 1 24 45 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446809/61a6f4f4-950a-11e5-9b23-a9efa1fbccfc.png">

# Related

- [contains](https://on.cypress.io/api/contains)
- [within](https://on.cypress.io/api/within)
- [find](https://on.cypress.io/api/find)
- [root](https://on.cypress.io/api/root)
