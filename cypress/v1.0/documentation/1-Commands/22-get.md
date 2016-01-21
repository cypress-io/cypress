slug: get
excerpt: Get an element

# [cy.get( *selector* )](#selector-usage)

Matches one or more DOM elements based on the selector.  The selector can be any valid jQuery selector.

`cy.get()` will **always** query from the current scope (default: document), and ignore previous commands.

If Cypress does not find any matching element(s), it will continue to retry until the [`commandTimeout`](https://on.cypress.io/guides/configuration) has been reached.

***

# [cy.get( *alias* )](#alias-usage)

[block:callout]
{
  "type": "info",
  "body": "[Read about using aliases first.](https://on.cypress.io/guides/using-aliases)",
  "title": "New to Cypess?"
}
[/block]

You can pass in the `@` character to find an [aliased](https://on.cypress.io/guides/using-aliases) element.

Internally Cypress keeps a cache of all aliased elements.  If the element currently exists in the DOM, it is immediately returned.  If the element no longer exists, Cypress will re-query the element based on the previous selector path to find it again.

***

# Options

Pass in an options object to specify the conditions of the command.

**cy.get( *selector*, *options* )**
**cy.get( *alias*, *options* )**

`cy.get` supports these options:

Option | Default | Notes
--- | --- | ---
`log` | `true` | Display command in command log

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