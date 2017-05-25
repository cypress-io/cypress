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

## Cypress is _Not_ Like jQuery

Cypress re-uses the selector search functionality of jQuery, but it does not share jQuery's execution model. Specifically, all Cypress commands are asynchronous and work more like Promises (more on this shortly).

In jQuery, if you want to operate on an element, you might do this:

```js
// $() returns immediately with an element collection
let myElement = $('.my-selector').first()
// Do work with it immediately
doSomething(myElement)
```

But in Cypress, calling `cy.get()` will not return a value (it returns ). You'll need to call `.then` on your command chain in order to yield the actual element.

```js
// cy.get() returns a Cypress Chainer instance, not a value!
cy.get('.my-selector')
  // .then() is a Chainer method that accepts a function
  .then(function(myElement) {
    // the function receives the value and can now do work
    doSomething(myElement)
  })
```

## Why Complicate This?

I hear you saying "Is it _really_ this complicated? I just want to get ahold of an element in the DOM! Shouldn't that be dead simple?" Of course! At first, it seems like you should be able to just reach out and grab the DOM. But you're forgetting something very important: the DOM is alive and ever-changing. What if the element isn't ready yet? Are you prepared to sprinkle wait-and-retry code throughout all your tests every time you select an element? No way! That's what we're trying to get away from!

Cypress was built to work with the natural flow of the browser environment, instead of against it. All Cypress commands are asynchronous with automatic retry and timeout built right in. If you look for a DOM element that isn't there immediately (perhaps it is animating in?), Cypress won't fail immediately. Instead it watches that selector to see if anything appears for a smear of time. Modern web applications must naturally deal in these smears of time due to network latency, DOM performance, events, intervals, and animations. Cypress _expects_ you to work this way, and it works this way as well.

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

That's it! If the element is not on that page, you'll get a failure. If it's there at any point during the timeout period, your test will go green.

Don't write complicated tests until you've mastered the simple ones! Cypress is very powerful and expressive, you may well find that you never actually need complicated tests, or that you need drastically fewer than you expected. Remember: _no code is faster than no code_.

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

It's crucially important to understand the mechanism by which Cypress Commands chain together: an asynchronous-yet-serial process of doing work on the Subject yielded to the Command, and yielding a Subject to the next Command.

## Subjects

Subjects are the unseen context of a `cy.` chain, the flow of current pushing energy from one Command to the next. Because Cypress is built upon the Promise pattern, that "pushing of energy" is called "yielding" instead of "returning": Cypress Commands do not return useful values, but rather a Cypress Chainer to continue building a sequence on Commands with.

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

# Assertions

Cypress bundles popular assertion libraries for you, and also uses them internally, automatically. It exposes synchronous and asynchronous assertion interfaces, so you're always a few keystrokes away from an expressive test.

But before we talk about _how_ to assert, let's talk about _whether_ to assert!

## To Assert, or Not To Assert?

Cypress makes dozens of assertions available to you via its included libraries, but sometimes the best test may make no assertions at all! What do we mean by this? Let's look at an example:

```js
cy.visit("/home")

cy.get(".main-menu")
  .contains("New Project")
  .click()

cy.get(".title")
  .type("My Awesome Project")

cy.get("form")
  .submit()
```

Without a single explicit assertion, there are dozens of ways this test can fail! Here's a few:

- the initial visit url could respond with something other than success
- any of the `cy.get()` Commands could fail to find their elements
- form submission could result in a non-success HTTP code
- the in-page JS (the application under test) could throw an error

Can you think of any more?

Cypress expects this veritable minefield of modern web development and seeks to visualize all this chaos in a reasonable way. Failures are important! Cypress makes them obvious and easy to understand.

As such, it may be beneficial to relax your test-obsessed mind and take a leisurely drive through your application: visit some pages, click some links, type into some fields, and call it a day. You can rest assured that _so many things **must** be working_ in order for you to be able to navigate from Page A to Page Z without error. If anything is fishy, Cypress will tell you about it... with laser focus.

## Writing an Assertion

There are two ways to write assertions in Cypress.

1. **Implicit Subjects:** Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)
2. **Explicit Subjects:** Using `expect`

## Implicit Subjects with [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)

Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and) commands is the preferred way of making an assertion in Cypress. These are typical Cypress Commands, which means they can be called against a Chainer and will ultimately be applied to the current Subject flowing through the chain.

```javascript
// the implicit subject here is the first <tr>
// this asserts that the <tr> has an .active class
cy.get("tbody tr:first").should("have.class", "active")
```

![implicit_assertion_class_active](https://cloud.githubusercontent.com/assets/1271364/12554600/4cb4115c-c34b-11e5-891c-84ff176ea38f.jpg)

## Explicit Subjects with `expect`

Using `expect` allows you to pass in a specific subject and make an assertion on the specified subject. These assertions are more commonly used when writing unit tests, but can also be used when writing integration tests.

```js
// the explicit subject here is the boolean: true
expect(true).to.be.true
```

{% note info Unit Testing %}
Check out our example recipes for [unit testing](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_application_code_spec.js) and [unit testing React components](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_react_enzyme_spec.js)
{% endnote %}

Explicit assertions are great when you want to perform custom logic prior to making the assertion. The usual caveats apply if you want to do work against the Subject: you'll need to do it asynchronously! The `.should()` Command allows us to pass a function that will be yielded the Subject, much the way `.then()` works.

```javascript
cy
  .get("p")
  .should(function($p){
    // return an array of texts from all of the p's
    var texts = $p.map(function(i, el){
      return cy.$(el).text()
    })

    // jquery map returns jquery object
    // and .get() convert this to simple array
    var texts = texts.get()

    // array should have length of 3
    expect(texts).to.have.length(3)

    // set this specific subject
    expect(texts).to.deep.eq([
      "Some text from first p",
      "More text from second p",
      "And even more text from third p"
    ])
})
```
