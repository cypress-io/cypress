title: Core Concepts
comments: true
---

# What You'll Learn

- what idiomatic Cypress looks like
- how to work with web applications
- how Cypress works like web apps: asynchronous and serial
- how to assert things yourself, and how Cypress asserts things for you
- the rules that make Cypress work, and how to follow them

{% note info Important! %}
**This is the single most important guide for understanding how to work with Cypress** to test your modern web application. Read it. Understand it. Ask questions about it so that we can improve it.
{% endnote %}

# Cypress Is Expressive

Expressivity is all about getting more done with less typing. Let's look at an example:

```js
describe("Post Resource", function() {
  it("Creating a new Post", function() {
    cy.visit("/posts/new") /* 1 */

    cy.contains("Post Title") /* 2 */
      .type("My First Post") /* 3 */

    cy.contains("Post Body") /* 4 */
      .type("Hello, world!") /* 5 */

    cy.get('button[type="submit"]') /* 6 */
      .click()

    cy.url() /* 7 */
      .should("eq", "/posts/my-first-post")

    cy.get('h1') /* 8 */
      .its('value')
      .should("eq", "My First Post")
  })
})
```

Can you read this? If you did, it might sound something like this:

{% note info %}
1. Visit the page at `/posts/new`
2. Find the element containing the text "Post Title"
3. Type "My First Post" into it
4. Find the element containing the text "Post Body"
5. Type "Hello, world!" into it
6. Select the `<button>` tag with a type of `submit`, click it
7. Grab the browser URL, ensure it is `/posts/my-first-post`
8. Select the `<h1>` tag, ensure it contains the text "My First Post"

{% endnote %}

This is a relatively simple, straightforward test, but consider how much code has been covered by it, both on the client and the server!

For the remainder of this guide we'll go through the basics of Cypress that make this example work. We'll demystify the rules Cypress follows so you can productively script the browser to act as much like an end user as possible, as well as discuss how to take shortcuts when it's useful.

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

Cypress re-uses the selector search functionality of jQuery ...actually, jQuery **IS** inside of Cypress, and all element references are real jQuery element objects, but Cypress does not share jQuery's execution model, it just wraps it. Specifically, all Cypress commands are asynchronous: they work more like Promises (more on this later.)

In jQuery, if you want to operate on an element, you might do this:

```js
// $() returns immediately with an element collection
let myElement = $('.my-selector').first()
// Do work with it immediately
doSomething(myElement)
```

But in Cypress, calling `cy.get()` will not return a value (actually, it returns a Cypress Chainer instance, but we aren't there yet.) You'll need to call `.then` on your command chain in order to yield the actual, jQuery-wrapped element.

```js
// cy.get() returns a Cypress Chainer instance, not a value!
cy.get('.my-selector')
  // .then() is a Chainer method that accepts a function
  .then(function(myElement) {
    // the function receives the value and can synchronously work with it
    doSomething(myElement)
  })
```

{% note info Why Complicate Element Selection? %}

If this seems a bit strange, bear with us a bit longer. This isn't needless complication of DOM queries, it's actually critically important to effectively testing web applications. We'll address this fundamental shift by the end of this document, stay tuned!

{% endnote %}

## Finding Elements by Their Contents

Another way to locate things -- a more human way -- is to look them up by their contents. For this, we can use `cy.contains()`, for example:

```js
// Finds a single element containing (at least) the text "New Post"
cy.contains("New Post")
```

This is helpful when writing tests from the perspective of a user interacting with the app. They just know they want to click the button labeled "Submit", they have no idea that it has a `type` attribute of `submit`, or a CSS class of `my-submit-button`.

`cy.contains()` is also a great example of a command that can start a chain, or continue a chain. For example, if we wanted to look for the text "New Post" _only inside of the `.main` element_, we could trivially achieve that like this:

```js
// First finds the element with class "main",
// then looks for children with the text "New Post"
cy.get('.main').contains("New Post")
```

## What If An Element Is Not Found?

Great question! Cypress is smart about finding elements; it knows that the DOM is a dynamic place where things change from one moment to the next, so it doesn't fail immediately if something isn't found. Instead, Cypress gives your app a chance to finish whatever it may be doing!

This is known as a `timeout`, and most commands may be customized with specific timeout periods. (The default is 4 seconds.) These Commands will list a `timeout` option in their API documentation, allowing you to set the number of milliseconds you need.

```js
// Give this selector 10 seconds to appear
cy.get('.my-slow-selector', { timeout: 10000 })
```

You can also set the timeout globally via the configuration setting `defaultCommandTimeout`.

{% note info Timeouts and Test Performance %}

There is a performance tradeoff here: essentially, **tests that have longer timeout periods take longer to fail**. Commands always proceed as soon as their criteria is met, so working tests will be performed as fast as possible. A test that fails due to timeout will consume the entire timeout period, by design. This means you want to increase your timeout period to suit your app, but you probably don't want to make it "extra long, just in case".

{% endnote %}

# Chains of Commands

It's crucially important to understand the mechanism by which Cypress Commands chain together: a queue of work to be done on some subject that flows from one command to the next. It's like Promises, but different, so don't reach for your favorite Promise library until we finish laying it all out.

## Interacting With Elements

As we saw in the initial example, Cypress makes it easy to click on and type into elements on the page by adding `.click()` and `.type()` commands to a `cy.get()` or `.contains()` command. This is a great example of chaining in action. Let's see it again:

```js
cy.get('textarea.post-body')
  .type("This is an excellent post.")
```

We're chaining the `.type()` onto the `cy.get()`, applying it to the "subject" of the `cy.get()` command, which will be a DOM element if it is found.

## Asserting Things About Elements

Oftentimes you just want to ensure an element exists, or has a particular attribute, CSS class, or child. Let's see assertions in action:

```js
cy.get(":checkbox").should("be.disabled")

cy.get("form").should("have.class", "form-horizontal")

cy.get("input").should("not.have.value", "foo")
```

You can also chain multiple assertions together using `.and()`, which is just another name for `.should()` that makes things more readable:

```js
cy.get("#header a")
  .should("have.class", "active")
  .and("have.attr", "href", "/users")
```

Cypress wraps Chai, Chai-jQuery, and Chai-Sinon to provide these assertions. You can [learn more in the Available Assertions Appendix](/guides/appendices/available-assertions.html).

{% note info Beware: Assertions That Change The Subject %}
Some assertions may modify the current subject unexpectedly. Read the next section on how subjects flow through a Cypress chain, then you'll understand what is happening when `cy.get('a').should('have.attr', 'href', '/users')` modifies the subject from the `a` element to the string `/users`.

{% endnote %}

## Subjects

A new Cypress chain always start with `cy.[something]`, where the `something` establishes what other methods can be called (chained) next. Some methods yield no subject and thus cannot be chained, such as `cy.clearCookies()` or `cy.screenshot()`. Some methods, such as `cy.get()` or `cy.contains()`, yield a jQuery-wrapped DOM element as a subject, allowing further methods to be chained onto them like `.click()` or even `.contains()` again.

{% note info %}
**Some commands can be chained:**
- ...only from `cy`, meaning they don't operate on a subject (`cy.clearCookies()`)
- ...only from commands yielding particular kinds of subjects (`.type()`)
- ...from `cy` *or* from a subject-yielding chain (`.contains()`)

**Some commands yield:**
- ...`null`, meaning they should not be chained against
- ...the same subject they were chained from
- ...a new subject as appropriate for the command

{% endnote %}

Examples:

```js
cy.clearCookies() // Done, no Subject, no chaining

cy.get('.main-container') // Subject is array of matching DOM elements
  .contains("Today's Headlines") // Subject is a DOM element
  .click() // Subject did not change
```

{% note info Yield, Don't Return %}
When discussing what Cypress commands do with subjects, we always say that they "yield" the subject, never that they "return" it. Remember: Cypress commands are asynchronous and get queued for execution at a later time! Subjects get yielded from command to command after lot of helpful framework code runs to ensure things are in order.

{% endnote %}

### Using `cy.wrap` To Inject A Custom Subject

Want to bring in a value from outside of the Command flow? You can quickly achieve that with `cy.wrap()`.

```js
cy.wrap(7).should("equal", 7)
```

`cy.wrap()` takes an argument as a new subject to yield to the next Command in the chain. Simple! The above is the asynchronous equivalent to: `expect(7).to.equal(7)`

### Using `.then` To Act Synchronously On A Subject

Want to jump into the Command flow and get your hands on the subject directly? No problem, simply add a `.then(function(subject) { })` to your Command chain. When the previous command resolves, it will call your custom function with the current subject as the first argument.

If you have more Commands to add after your `.then()`, you'll need to maintain the subject chain by synchronously returning the new subject.

Let's look at an example:

```js
cy.get('a.some-link') // Find all links with class 'some-link'
  .first()            // Grab the first one
  .then(function(myElement) { // Work with it a moment...
    // Extract its href as a string
    let linkDestination = myElement.attr('href')
    // This string is yielded into the next command in the chain
    return linkDestination
  }).should('equal', 'http://example.com') // .should works against Strings!
```

### Using Aliases to Refer to Previous Subjects

Cypress has some added functionality for quickly referring back to past DOM element subjects called [Aliases](/guides/cypress-basics/aliases-variables-in-an-async-world.html). It looks something like this:

```js
cy.get('.my-selector')
  .as('myElement') // sets the alias
  .click()

/* many more actions */

cy.get('@myElement') // re-queries the DOM as before only if necessary
  .click()
```

This lets us reuse our DOM queries for faster tests when the element is still in the DOM, and it automatically handles re-querying the DOM for us in the same way as before if it is not.

## Commands Are Asynchronous

It is very important to understand that Cypress commands don't do anything at the moment they are invoked, but rather enqueue themselves to be run later. This is what we mean when we say Cypress commands are asynchronous.

Take this simple test, for example:

```js
it("changes the URL when 'awesome' is clicked", function() {
  cy.visit('/my/resource/path') // Nothing happens yet

  cy.get('.awesome-selector') // Still nothing happening
    .click() // Nope, nothing

  cy.url() // Nothing to see, yet
    .should("eq", '/my/resource/path#awesomeness') // Nada.
}) // Ok, the test method has returned, time to do everything!
```

{% note info Core Concept %}
Each Cypress command (and chain of commands) returns immediately, having done nothing but appending to a queue of commands to be executed at a later time.

{% endnote %}

## Commands Execute Serially

After a test method is finished running, Cypress wakes up and starts executing the commands that were enqueued during the test. The test above would cause an execution in this order:

1. Visit a URL
2. Find a selector
3. Perform a click action
4. Grab the current URL
5. Make an assertion

These actions will always happen serially (one after the other), never in parallel (at the same time).

{% note info Core Concept %}
Any waiting or retrying that is necessary to ensure a step was successful must complete before the next step begins. If they don't complete successfully before the timeout is reached, the test will fail.

{% endnote %}

## Commands Are Really Promises

This is the big secret of Cypress: we've taken our favorite pattern for composing JavaScript code, Promises, and built them right into the fabric of Cypress. Above, when we say we're enqueuing actions to be taken later, we could restate that as "adding Promises to the Promise chain".

We do this under the hood to free the end user from having to master the Promise pattern up front: no importing Promise libraries, no remembering which methods are available and their signatures, and no forgetting to return every Promise, Cypress does all this for you.

To rewrite the above example as idiomatic Promise-based code, it would look something like:

```js
it("changes the URL when 'awesome' is clicked", function() {
  return cy.visit('/my/resource/path').then(function() {
    cy.get('.awesome-selector')
  }).then(function($element) {
    $element.click()
  }).then(function() {
    cy.url()
  }).then(function(url) {
    expect(url).to.eq('/my/resource/path#awesomeness')
  })
})
```

Not very pretty, right? This is essentially what Cypress builds for you behind the scenes, so embrace the beautiful language of Cypress commands and let it do the heavy lifting for you!

# Assertions

In testing, assertions are how you ensure things are as you expect them to be. In english, this might be phrased as "I assert that two plus two equals four", or "I assert that, when passed two and two as arguments, the addition function returns four." The idea is to throw an error if the condition is ever _not_ true.

## Assertion Libraries

Cypress bundles [popular assertion libraries](/guides/appendices/available-assertions.html) for you, and exposes synchronous and asynchronous assertion interfaces. In Cypress, you're always a few keystrokes away from an expressive test.

But before we talk about _how_ to assert, let's talk about _whether_ to assert!

## To Assert, or Not To Assert?

Despite the dozens of assertions Cypress makes available to you, sometimes the best test may make no assertions at all! How can this be? Let's look at an example:

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

{% note info %}
Even with no assertions, a few lines of Cypress can ensure thousands of lines of code are working properly, both on the client and server!

{% endnote %}

Cypress anticipates the many traps of modern web development and seeks to visualize all this chaos in a reasonable way. Failures are important! Cypress makes them obvious and easy to understand.

As such, it may help to relax your test-obsessed mind and take a leisurely drive through your application: visit some pages, click some links, type into some fields, and call it a day. You can rest assured that _so many things **must** be working_ in order for you to be able to navigate from Page A to Page Z without error. If anything is fishy, Cypress will tell you about it... with laser focus.

## Writing an Assertion

There are two ways to write assertions in Cypress.

1. **Implicit Subjects:** Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)
2. **Explicit Subjects:** Using `expect`

## Implicit Subjects with [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)

Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and) commands is the preferred way of making an assertion in Cypress. These are typical Cypress Commands, which means they can be called against a Chainer and will ultimately be applied to the current Subject in the chain.

```javascript
// the implicit subject here is the first <tr>
// this asserts that the <tr> has an .active class
cy.get("tbody tr:first").should("have.class", "active")
```

![implicit_assertion_class_active](https://cloud.githubusercontent.com/assets/1271364/12554600/4cb4115c-c34b-11e5-891c-84ff176ea38f.jpg)

## Explicit Subjects with `expect`

Using `expect` allows you to pass in a specific subject and make an assertion about it. These assertions are more commonly used when writing unit tests, but can also be used when writing integration tests.

```js
// the explicit subject here is the boolean: true
expect(true).to.be.true
```

{% note info Unit Testing %}
Check out our example recipes for [unit testing](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_application_code_spec.js) and [unit testing React components](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_react_enzyme_spec.js)
{% endnote %}

Explicit assertions are great when you want to perform custom logic prior to making the assertion. The usual caveats apply if you want to do work against the Subject: you'll need to do it asynchronously! The `.should()` Command allows us to pass a function that will be yielded the Subject. This works just like `.then()`, except Cypress will apply its retry-until-timeout magic to the function passed to `.should()`.

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
