title: Commands, Elements, and Assertions
comments: true
---

# What You'll Learn

- how Cypress wraps jQuery to look up elements by selector
- what parent, child, and dual commands are, implicit subject management
- how to make explicit assertions in Cypress
- how Cypress asserts things automatically, freeing the developer to focus on features

# Finding Elements

## Cypress is Like jQuery

In jQuery, you look up elements like this:

```js
$('.my-selector')
```

Similarly, in Cypress you look up elements like this:

```js
cy.get('.my-selector')
```

Just the same, right? So we can just assign that and move on with our day?

```js
// This will not work!
let myElement = cy.get('.my-selector')
```

Not so fast...

## Cypress is _Not Like_ jQuery

Cypress re-uses the selector search functionality of jQuery, but it does not share jQuery's execution model. Specifically, all Cypress commands are asynchronous and work more like Promises.

In jQuery, if you want to operate on an element, you might do this:

```js
let myElement = $('.my-selector').first()
```

But in Cypress, calling `cy.get()` will not return anything. You'll need to call `.then` on your command chain in order to yield the actual element.

```js
cy.get('.my-selector').then(function(myElement) {
  doSomething(myElement)
})
```
