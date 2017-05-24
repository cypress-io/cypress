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

### What About Non-Existence?

Asserting that an element does _not_ exist does require an explicit assertion, as we expect this to be a rarer case. It's still simple:

```js
cy.get('.element-i-do-not-desire').should("not.exist")
```

This will use the same time-smear, timeout mechanism as before, retrying until either the element is not found, or the timeout is reached.

## Command Timeouts

Many Commands have configurable timeouts, enabling you to tune Cypress's behavior to your needs. These Commands will list a `timeout` option in their API documentation, allowing you to set the number of milliseconds you need.

```js
// Give this selector 10 seconds to appear
cy.get('.my-slow-selector', { timeout: 10000 })
```

You can also set the timeout globally via the configuration setting `defaultCommandTimeout`.

There is a performance tradeoff here: essentially, tests that have longer timeout periods take longer to fail. Commands always proceed as soon as their criteria is met, so working tests will be performed as fast as possible. A test that fails due to timeout will consume the entire timeout period, by design. This means you want to increase your timeout period to suit your app, but you probably don't want to make it "extra long, just in case".

# Chaining Commands

It's crucially important to understand the mechanism by which Cypress Commands chain together, an asynchronous-yet-serial process of doing work on a subject yielded to the Command and yielding a subject to the next Command.

## Subjects

Subjects are the unseen context of a `cy.` chain, the flow of current pushing energy from one Command to the next. Because Cypress is built upon the Promise pattern, that "pushing of energy" is called "yielding" instead of "returning": Cypress Commands do not return useful values, but rather a Promise chain to build upon.

Cypress Commands must be executed against an appropriate subject. For instance, you can't call `cy.should("equal", 7)` directly: what should equal 7? `.should()` requires a subject!

### Using `cy.wrap` To Inject A Custom Subject

Want to bring in a value from outside of the Command flow? You can quickly achieve that with `cy.wrap()`. To rewrite the incorrect usage of `.should` above, let's push the number 7 into Cypress land:

```js
cy.wrap(7).should("equal", 7)
```

`cy.wrap()` takes an argument as a new subject to yield to the next Command in the chain. Simple!

### Using `.then` To Act Synchronously On A Subject

Want to jump into the Command flow and get your hands on the subject directly? No problem, simply add a `.then(function(subject) { /* act here */ })` to your Command chain. When Cypress finishes the previous Command, it will yield control to your custom function, passing in the current subject as the first argument.

If you have more Commands to add after your `.then()`, you'll need to maintain the subject chain by synchronously returning the new subject.

Let's look at an example:

```js
cy.get('a.some-link').first().then(function(myElement) {
  // Do something with the given subject, which happens to be a link element
  let linkDestination = myElement.attr('href')
  // Causes the next Command to be executed with this String as subject
  return linkDestination
}).should('equal', 'http://example.com') // .should works against Strings!
```

## Asynchronous, Yet Serial

We've said multiple times now that all Cypress Commands are asynchronous, but this can be misleading. Normally in JavaScript, when we say things are asynchronous you can go ahead an assume that means lots of things can happen meanwhile. For instance, animations don't freeze while an XHR is in flight, nor does the XHR block other events from firing.

But that's JavaScript land. What Cypress is emulating is _a human being interacting with a web site_. Human beings do things serially: one after the other.

The Cypress Command driver also does things one after the other. Each `cy.` method:
- enqueues an action to be taken later
- returns immediately

So a test function made up entirely of Cypress commands will itself execute quite fast: all it really does is enqueue a bunch of actions. Once your function exits, Cypress is ready to kick off and start executing those actions, first-in-first-out. One. Action. At. A. Time.
