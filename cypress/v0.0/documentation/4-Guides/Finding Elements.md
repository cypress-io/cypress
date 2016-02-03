slug: finding-elements
excerpt: Traverse the DOM, find elements, make assertions

# Contents

- :fa-angle-right: [Traversal](#section-traversing-the-dom)
  - [List of Commands](#dom-traversal-commands)
  - [Starting a Query](#querying-for-elements)
  - [CSS Selectors](#dom-css-selector-support)
- :fa-angle-right: [Existance](#section-a-dom-element-s-existence)
  - [Waiting for an element to exist](#section-asserting-an-element-s-existence-is-an-anti-pattern)
  - [Waiting for an element to not exist](#section-how-to-assert-an-element-does-not-exist)
- :fa-angle-right: [Assertions](#section-a-dom-element-s-existence)
  - [Asserting length](#section-how-to-assert-an-element-does-not-exist)
  - [Asserting classes](#section-how-to-assert-an-element-does-not-exist)
  - [Asserting value](#section-how-to-assert-an-element-does-not-exist)
  - [Asserting attributes](#section-how-to-assert-an-element-does-not-exist)
  - [Asserting text content](#section-how-to-assert-an-element-does-not-exist)
  - [Asserting visibility](#section-how-to-assert-an-element-does-not-exist)
  - [Asserting state](#section-how-to-assert-an-element-does-not-exist)

***

# Traversing the DOM

At the heart of all integration tests is the DOM. Cypress gives you a host of familiar commands to make traversing the DOM as easy as possible.

You'll notice many of these commands match the same behavior as their [jQuery counterparts](https://api.jquery.com/category/traversing/).

## List of Commands

- [children](https://on.cypress.io/api/children)
- [closest](https://on.cypress.io/api/closest)
- [eq](https://on.cypress.io/api/eq)
- [find](https://on.cypress.io/api/find)
- [filter](https://on.cypress.io/api/filter)
- [first](https://on.cypress.io/api/first)
- [get](https://on.cypress.io/api/get)
- [last](https://on.cypress.io/api/last)
- [next](https://on.cypress.io/api/next)
- [not](https://on.cypress.io/api/not)
- [parent](https://on.cypress.io/api/parent)
- [parents](https://on.cypress.io/api/parents)
- [prev](https://on.cypress.io/api/prev)
- [siblings](https://on.cypress.io/api/siblings)

## Starting a Query

In Cypress, you will almost always start a sequence of traversal commands with `cy.get`. You can think of `cy.get` as the same as jQuery's `$`.

The follow examples are equivalent:

```javascript
// return the element with id: 'main'
cy.get("#main") // in cypress
$("#main")      // in jquery

// we can chain other traversal commands
// using the same familiar pattern
cy.get("#main").find("ul").children("li").first() // in cypress
$("#main").find("ul").children("li").first()      // in jquery
```

## CSS Selectors

All DOM commands support the same CSS selectors found in the [jQuery Sizzle](https://sizzlejs.com/) engine.


```javascript
// All of the commands below are valid

cy.get("ul").find("li:nth-child(odd)")

cy.get("select[name=list] :not(:selected)")

cy.get(".container").children("input:disabled'")

cy.get("header").find("*")

cy.get("input[type=checkbox]").first("input:checked")

cy.get("span:nth-of-type(2)")

cy.get("input[data-js='user-name'][ng-input]")
```

# A DOM Element's Existence

## Asserting an element's existence is an anti-pattern

All commands that return a DOM element implicitly assert the existence of the DOM element it is attempting to query. Cypress will check for the existence of the DOM element for the duration of the command's [`commandTimeout`](https://on.cypress.io/guides/configuration).

```javascript
// This is an anti-pattern
cy.get("#nav-bar").should("exist")
                     ↲
  // this command will not run until the #nav-bar exists
        // this assertion is unnecessary

```

## How to assert an element does not exist

You would write an assertion if you want to ensure that the DOM element does *not* exist. Cypress knows to disable it's default behavior of checking for the DOM element's existence by looking ahead to the assertion.

```javascript
cy.get(".dropdown-menu").should("not.exist")
                            ↲
  // Cypress looks ahead to see you expect the element to not exist
      // the 'get' command will no longer check for existence

```


