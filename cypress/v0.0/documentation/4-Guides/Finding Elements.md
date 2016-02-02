slug: finding-elements
excerpt: Traverse the DOM to find and make asssertions about elements

# Contents

- :fa-angle-right: [Traversing the DOM](#section-traversing-the-dom)
  - [DOM Traversal Commands](#dom-traversal-commands)
  - [CSS Selector Support](#dom-css-selector-support)
- :fa-angle-right: [A Dom Element's Existence](#section-a-dom-element-s-existence)
  - [Asserting an element's existence is an anti-pattern](#section-asserting-an-element-s-existence-is-an-anti-pattern)
  - [How to assert an element does not exist](#section-how-to-assert-an-element-does-not-exist)

***

# Traversing the DOM

There are various commands in Cypress that are used to locate DOM elements in the page. You'll want to choose the command that is the most appropriate based on the location of your elements on the page. You'll recognize many of the Cypress commands as having similar traversal logic as many of [jQuery's traversal methods](https://api.jquery.com/category/traversing/).

## DOM Traversal Commands

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

## CSS Selector Support

All traversal commands support the same CSS selectors supported in the jQuery [Sizzle](https://sizzlejs.com/) engine.


```javascript
// All of the commands below are valid

cy.get("ul").find("li:nth-child(odd)")

cy.get("select[name=list] :not(:selected)")

cy.get(".container").children("input:disabled'")

cy.get("header").find("*")

cy.get("input[type=checkbox]").first("input:checked")

cy.get("span:nth-of-type(2)")

cy.get("input[data-js='user-name'][name='name']")
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


