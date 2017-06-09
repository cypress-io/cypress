---
title: Cypress in a Nutshell
comments: true
---

{% note info %}
### {% fa fa-graduation-cap %} What You'll Learn

- what Cypress looks like
- how Cypress queries the DOM more safely than jQuery
- how Cypress manages subjects and chains of commands
- what assertions look like and how they work
{% endnote %}

{% note danger Important! %}
**This is the single most important guide for understanding how to work with Cypress** to test your modern web application. Read it. Understand it. Ask questions about it so that we can improve it.
{% endnote %}

# Cypress Is Expressive

Expressivity is all about getting more done with less typing. Let's look at an example:

```js
describe("Post Resource", function() {
  it("Creating a new Post", function() {
    cy.visit("/posts/new")     // 1.

    cy.get("input.post-title") // 2.
      .type("My First Post")   // 3.

    cy.get("input.post-body")  // 4.
      .type("Hello, world!")   // 5.

    cy.contains('Submit')      // 6.
      .click()                 // 7.

    cy.url()                   // 8.
      .should("eq", "/posts/my-first-post")

    cy.get('h1')               // 9.
      .its('value')
      .should("eq", "My First Post")
  })
})
```

Can you read this? If you did, it might sound something like this:

> 1. Visit the page at `/posts/new`.
> 2. Find the `<input>` with class `post-title`.
> 3. Type "My First Post" into it.
> 4. Find the `<input>` with class `post-body`.
> 5. Type "Hello, world!" into it.
> 6. Find the element containing the text `Submit`.
> 7. Click it.
> 8. Grab the browser URL, ensure it is `/posts/my-first-post`.
> 9. Select the `<h1>` tag, ensure it contains the text "My First Post".

This is a relatively simple, straightforward test, but consider how much code has been covered by it, both on the client and the server!

For the remainder of this guide, we'll explore the basics of Cypress that make this example work. We'll demystify the rules Cypress follows so you can productively script the browser to act as much like an end user as possible, as well as discuss how to take shortcuts when it's useful.

# Finding Elements

## Cypress is Like jQuery

In jQuery, you're used to looking up elements like this:

```js
$('.my-selector')
```

In Cypress, the query is the same:

```js
cy.get('.my-selector')
```

In fact, Cypress wraps jQuery and exposes all of its DOM selection and traversal methods to you so you can work with complex HTML structures with ease.

```js
// Each method is equivalent to its jQuery counterpart. Use what you know!
cy.get('#main-content')
  .find('.article')
  .children('img[src^="/static"]')
  .first()
```

{% note success Core Concept %}
Cypress leverages jQuery's powerful query engine to make tests familiar and readable for modern web developers.

{% endnote %}

Accessing the DOM elements from the query works differently, however:

```js
// This is fine, jQuery returns the element synchronously.
let $jqElement = $('.my-selector')

// This will not work! Cypress does not return the element synchronously.
let $cyElement = cy.get('.my-selector')
```

Let's look at why this is...

## Cypress is _Not_ Like jQuery

**Question:** What happens when jQuery can't find the selector it queries?

**Answer:** *Oops!* The dreaded `null` enters your code, and you ignore it at your own risk!

```js
// $() returns immediately with null
let $myElement = $('.my-selector').first()
// Leads to errors or ugly null checks
doSomething($myElement)
```

**Question:** What happens when Cypress can't find the selector it queries?

**Answer:** *No big deal!* Anticipating this kind of thing, Cypress automatically retries the query for you until it is found, or the timeout is reached.

```js
// cy.get() queries using jQuery, repeating the query until...
cy.get('.my-selector').first()
  // ...it finds the element! You can now work with it by using .then
  .then(function($myElement) {
    doSomething($myElement)
  })
  // ...it doesn't find the element before its timeout.
  // Cypress halts and fails the test.
  // No null checks necessary because no other code runs!
```

This makes Cypress robust, immune to dozens of common, irritating problems at once. Consider all the circumstances that could cause the jQuery version to fail:
- the DOM has not loaded yet
- your framework hasn't finished bootstrapping
- an XHR hasn't completed
- an animation hasn't completed
- and on and on...

Traditionally, you'd be forced to write custom code to protect against any and all of these issues: a nasty mashup of arbitrary waits, conditional retries, and null checks littering your code. Not in Cypress! With built-in retrying and customizable timeouts, Cypress sidesteps all of this, instantly.

{% note success Core Concept %}
Cypress wraps all DOM queries with robust retry-and-timeout logic that better suits how real web apps work. We trade a minor change in how we work with our queries for a major stability upgrade to all our tests. Banish flake for good!

{% endnote %}

{% note info %}
In Cypress, when you want to interact with a DOM element directly, call `.then()` and pass a function to it that will receive the element. When you need to skip the retry-and-timeout functionality entirely and perform a traditional, synchronous query, you can still use `Cypress.$()`.

For more, check out the API docs for [`.then()`](http://on.cypress.io/api/then) and [`Cypress.$()`](http://on.cypress.io/api/utilities/$.html).
{% endnote %}

## Finding Elements by Their Contents

Another way to locate things -- a more human way -- is to look them up by their contents, by what the user sees on the page. For this, there's the handy `cy.contains()`, for example:

```js
// Finds a single element containing (at least) the text "New Post"
cy.contains("New Post")
```

This is helpful when writing tests from the perspective of a user interacting with the app. They just know they want to click the button labeled "Submit", they have no idea that it has a `type` attribute of `submit`, or a CSS class of `my-submit-button`.

`cy.contains()` is also a great example of a command that can start a chain, or continue a chain. For example, if we wanted to look for the text "New Post" _only inside of the `.main` element_, we could trivially achieve that like so:

```js
// First finds the element with class "main",
// then looks for children with the text "New Post"
cy.get('.main').contains("New Post")
```

## What If An Element Is Not Found?

As we showed above, Cypress anticipates the asynchronous nature of web applications and doesn't fail immediately when an element is not found. Instead, Cypress gives your app a window of time to finish whatever it may be doing!

This is known as a `timeout`, and most commands may be customized with specific timeout periods (the default timeout is 4 seconds.) These Commands will list a `timeout` option in their API documentation, allowing you to set the number of milliseconds you need.

```js
// Give this selector 10 seconds to appear
cy.get('.my-slow-selector', { timeout: 10000 })
```

You can also set the timeout globally via [the configuration setting `defaultCommandTimeout`](/guides/appendices/configuration.html#Timeouts).

{% note success Core Concept %}
To match the behavior of web applications, Cypress is deeply asynchronous and must rely on timeouts to know when to stop waiting on an app to get into a valid state. Timeouts can be configured globally, or on a per-command basis.

{% endnote %}

{% note info Timeouts and Performance %}

There is a performance tradeoff here: **tests that have longer timeout periods take longer to fail**. Commands always proceed as soon as their criteria is met, so working tests will be performed as fast as possible. A test that fails due to timeout will consume the entire timeout period, by design. This means that while you _may_ want to increase your timeout period to suit specific parts of your app, you _don't_ want to make it "extra long, just in case".

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

Assertions let you do things like ensuring an element exists or has a particular attribute, CSS class, or child. Assertions are just commands that apply to the current subject and halt the test if they aren't true. Here's a quick look at assertions in action:

```js
cy.get(":checkbox").should("be.disabled")

cy.get("form").should("have.class", "form-horizontal")

cy.get("input").should("not.have.value", "foo")
```

We'll learn more about assertions in the last section of this guide.

## Subjects

A new Cypress chain always starts with `cy.[something]`, where the `something` establishes what other methods can be called next (chained). Some methods yield no subject and thus cannot be chained, such as `cy.clearCookies()` or `cy.screenshot()`. Some methods, such as `cy.get()` or `cy.contains()`, yield a jQuery-wrapped DOM element as a subject, allowing further methods to be chained onto them like `.click()` or even `.contains()` again.

{% note info %}
**Some commands can be chained:**
- ...only from `cy`, meaning they don't operate on a subject (`cy.clearCookies()`)
- ...only from commands yielding particular kinds of subjects (`.type()`)
- ...from `cy` *or* from a subject-yielding chain (`.contains()`)

**Some commands yield:**
- ...`null`, meaning they cannot be chained against
- ...the same subject they were chained from
- ...a new subject, as appropriate for the command

{% endnote %}

Examples:

```js
cy.clearCookies() // Done: no Subject, thus no chaining possible

cy.get('.main-container') // Subject an is array of matching DOM elements
  .contains("Today's Headlines") // Subject is a DOM element
  .click() // Subject does not change
```

{% note info Yield, Don't Return %}
When discussing what Cypress commands do with subjects, we always say that they "yield" the subject, never that they "return" it. Remember: Cypress commands are asynchronous and get queued for execution at a later time. Subjects get yielded from one command to the next after lot of helpful Cypress code runs to ensure things are in order.

{% endnote %}

### Using `cy.wrap` To Inject A Custom Subject

Want to bring in a value from outside of the Command flow? You can quickly achieve that with `cy.wrap()`.

```js
cy.wrap(7).should("equal", 7)
```

`cy.wrap()` takes an argument as a new subject to yield to the next Command in the chain. Simple! The above is the asynchronous equivalent to: `expect(7).to.equal(7)`.

### Using `.then` To Act Synchronously On A Subject

Want to jump into the Command flow and get your hands on the subject directly? No problem, simply add a `.then(function(subject) { })` to your Command chain. When the previous command resolves, it will call your custom function with the current subject as the first argument.

If you have more Commands to add after your `.then()`, you'll need to maintain the subject chain by synchronously returning the new subject.

Let's look at an example:

```js
cy.get('a.some-link') // Find all links with class 'some-link'
  .first()            // Grab the first one
  .then(function($myElement) { // Work with it a moment...
    // Extract its href as a string
    let linkDestination = $myElement.attr('href')
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

This lets us reuse our DOM queries for faster tests when the element is still in the DOM, and it automatically handles re-querying the DOM for us as before when it is not in the DOM.

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

Cypress doesn't kick off the browser automation magic until the test function exits.

{% note success Core Concept %}
Each Cypress command (and chain of commands) returns immediately, having only appended to a queue of commands to be executed at a later time.

{% endnote %}

## Commands Execute Serially

After a test function is finished running, Cypress goes to work executing the commands that were enqueued by `cy.*` commands. The test above would cause an execution in this order:

1. Visit a URL
2. Find a selector
3. Perform a click action
4. Grab the URL that matches a string

These actions will always happen serially (one after the other), never in parallel (at the same time). Why? To illustrate this, let's revisit that list of actions and expose some of the hidden magic Cypress does for us at each step:

1. Visit a URL **(and wait for the `onload` event to fire)**
2. Find a selector **(and retry repeatedly if it is not found)**
3. Perform a click action **(unless the element is covered or hidden)**
4. Grab the URL that matches a string **(and retry repeatedly until it matches)**

As you can see, Cypress does a lot of extra work to ensure the state of the application matches what our commands have declared about it... with a few seconds of wiggle room to get there!

{% note success Core Concept %}
Any waiting or retrying that is necessary to ensure a step was successful must complete before the next step begins. If they don't complete successfully before the timeout is reached, the test will fail.

{% endnote %}

## Commands Are Really Promises

This is the big secret of Cypress: we've taken our favorite pattern for composing JavaScript code, Promises, and built them right into the fabric of Cypress. Above, when we say we're enqueuing actions to be taken later, we could restate that as "adding Promises to the Promise chain".

We do this under the hood to free the end user from having to master the Promise pattern up front: no importing Promise libraries, no remembering which methods are available and their signatures, and no forgetting to return every Promise; Cypress does all this for you.

Let's compare the prior example to fictional version of it as raw, Promise-based code:

```js
// Noisy Promise demonstration. Not valid code.
it("changes the URL when 'awesome' is clicked", function() {
  return cy.visit('/my/resource/path').then(function() {
    return cy.get('.awesome-selector')
  }).then(function($element) {
    $element.click()
  }).then(function() {
    return cy.url()
  }).then(function(url) {
    expect(url).to.eq('/my/resource/path#awesomeness')
  })
})

// How Cypress really looks, Promises wrapped up and hidden from us.
it("changes the URL when 'awesome' is clicked", function() {
  cy.visit('/my/resource/path')

  cy.get('.awesome-selector')
    .click()

  cy.url()
    .should("eq", '/my/resource/path#awesomeness')
})
```

Big difference! The Promise demonstration is not real code (so don't try it), but it shows the magnitude of what Cypress handles for you behind the scenes. Embrace the beautiful language of Cypress commands and let it do the heavy lifting for you!

{% note success Core Concept %}
Cypress is built using Promises internally, but the developer testing with Cypress should not have need for their own Promises in tests the vast majority of the time.

{% endnote %}

# Assertions

Assertions are how you ensure things are as you expect in your tests. In english, this might be phrased as:
> I assert that two plus two equals four.

...or:

> I assert that, when passed `two` and `two` as arguments, the `add` function returns `four`.

...and in code:

```js
expect( add(2, 2) ).to.equal( 4 )
```

The idea is to throw an error if the condition is ever _not_ true.

## When To Assert?

Despite the dozens of assertions Cypress makes available to you, sometimes the best test may make no assertions at all! How can this be? Aren't assertions a basic part of testing?

Consider this example:

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

Cypress anticipates the chaos of modern web development and visualizes it in a reasonable way. Failures are important! Cypress makes them obvious and easy to understand.

As such, it may help to relax your test-obsessed mind and take a leisurely drive through your application: visit some pages, click some links, type into some fields, submit a form, and call it a day. You can rest assured that _so many things must be working_ in order for you to be able to navigate from Page A to Page Z without error. If anything is fishy, Cypress will tell you about it... with laser focus!

## What Assertions Are Available?

Cypress wraps Chai, Chai-jQuery, and Chai-Sinon to provide the built-in assertions. You can learn more in [the Available Assertions Appendix](/guides/appendices/available-assertions.html). You can also write your own assertions as Chai plugins and use them in Cypress.

## Writing Assertions

There are two ways to write assertions in Cypress:

1. **Implicit Subjects:** Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)
2. **Explicit Subjects:** Using `expect`

{% note info Assertion Libraries %}
Cypress bundles [popular assertion libraries](/guides/appendices/available-assertions.html) for you, and exposes synchronous and asynchronous assertion interfaces. In Cypress, you're always a few keystrokes away from an expressive test.

{% endnote %}

## Implicit Subjects with [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and)

Using [`cy.should`](https://on.cypress.io/api/should) or [`cy.and`](https://on.cypress.io/api/and) commands is the preferred way of making assertions in Cypress. These are typical Cypress commands, which means they apply to the current subject in the command chain.

```javascript
// the implicit subject here is the first <tr>
// this asserts that the <tr> has an .active class
cy.get("tbody tr:first").should("have.class", "active")
```

You can chain multiple assertions together using `.and()`, which is just another name for `.should()` that makes things more readable:

```js
cy.get("#header a")
  .should("have.class", "active")
  .and("have.attr", "href", "/users")
```

Because `should("have.class", ...)` does not change the subject, the `.and("have.attr", ...)` is executed against the same element. This is handy when you need to assert multiple things against a single subject quickly, but there are pitfalls...

{% note danger Beware: Assertions That Change The Subject %}
Some assertions modify the current subject unexpectedly. For example, the line `cy.get('a').should('have.attr', 'href', '/users')` modifies the subject from the `<a>` element to the string `"/users"`. This is because Cypress honors the return value of the assertion, and `have.attr` is a `Chai-jQuery` assertion that returns the matched string instead of the original subject. This can be surprising!

Whenever you have failing assertions and don't understand why, click the line in the Cypress Command Log on the left side of the GUI. Cypress will print details to the browser console to help you troubleshoot what is going on.

{% endnote %}

If we wrote this assertion in the explicit form ("the long way"), it would look like this:

```js
cy.get("tbody tr:first").should(function($tr) {
  expect($tr).to.have.class('active')
})
```

The implicit form is much shorter! So when would you want to use the explicit form?

## Explicit Subjects with `expect`

Using `expect` allows you to pass in a specific subject and make an assertion about it. This is probably how you're used to seeing assertions written as it is very common in unit tests:

```js
// the explicit subject here is the boolean: true
expect(true).to.be.true
```

{% note info Are you trying to write Unit Tests? %}
Check out our example recipes for [unit testing](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_application_code_spec.js) and [unit testing React components](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_react_enzyme_spec.js)
{% endnote %}

Explicit assertions are great when you want to:
- perform custom logic prior to making the assertion
- make multiple assertions against the same subject

The usual caveats apply if you want to do work against the subject: you'll need to do it asynchronously! The `.should()` command allows us to pass a function that will be yielded the subject. This works just like `.then()`, except Cypress will apply its retry-until-timeout magic to the function passed to `.should()`.

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

{% note danger Make sure `.should()` is safe %}
When using a function passed to `.should()`, be sure that the entire function can be executed multiple times without issue. Cypress applies its retry logic to these functions: so long as there's a failure, it will repeatedly try again until the timeout is reached.

{% endnote %}
