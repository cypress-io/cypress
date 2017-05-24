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

Cypress re-uses the selector search functionality of jQuery, but it does not share jQuery's execution model. Specifically, all Cypress commands are asynchronous and work more like Promises (more on this shortly).

In jQuery, if you want to operate on an element, you might do this:

```js
let myElement = $('.my-selector').first()
doSomething(myElement)
```

But in Cypress, calling `cy.get()` will not return anything. You'll need to call `.then` on your command chain in order to yield the actual element.

```js
cy.get('.my-selector').then(function(myElement) {
  doSomething(myElement)
})
```

## Why Complicate This?

I hear you saying "Is it _really_ this complicated? I just want to get ahold of an element in the DOM! Shouldn't that be dead simple?" Of course! At first, it seems like you should be able to just reach out and grab the DOM. But you're forgetting something very important: the DOM is alive and ever-changing. What if the element isn't ready yet? Are you prepared to sprinkle wait-and-retry code throughout all your tests every time you select an element? No way! That's what we're trying to get away from!

Cypress was built to work with the natural flow of the browser environment, instead of against it. All Cypress commands are asynchronous with automatic retry and timeout built right in. If you look for a DOM element that isn't there immediately (perhaps it is animating in?), Cypress won't fail immediately. Instead it watches that selector to see if anything appears for a smear of time. Modern web applications naturally deal in these smears of time due to network latency, DOM performance, events, intervals, and animations. Cypress _expects_ you to work this way, and it works this way as well.

## Existence is Guaranteed

When you're first writing Cypress tests, you may be tempted to ensure elements exist, like this:

```js
cy.get('.my-selector').should("exist")
```

But this is almost never necessary! Cypress will automatically fail if a `cy.get()` command doesn't find any matching elements before its timeout. That means a smoke test might be implemented as simply as:

```js
cy.visit('/path/to/page/under/test.html')
cy.get('.element-i-desire')
```

That's it! If the element is not on that page, you'll get a failure. If it's there at any point during the timeout period, you'll go green.

Don't write complicated tests until you've mastered the simple ones! Cypress is very powerful and expressive, you may well find that you never actually need complicated tests, or that you need drastically fewer than you expected. Remember: no code is faster than _no code_.
