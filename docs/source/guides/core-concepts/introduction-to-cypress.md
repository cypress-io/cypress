---
title: Introduction to Cypress
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How Cypress queries the DOM
- How Cypress manages subjects and chains of commands
- What assertions look like and how they work
- How timeouts are applied to commands
{% endnote %}

{% note success Important! %}
**This is the single most important guide** for understanding how to test with Cypress. Read it. Understand it. Ask questions about it so that we can improve it.
{% endnote %}

# Cypress Is Simple

Simplicity is all about getting more done with less typing. Let's look at an example:

```js
describe('Post Resource', function() {
  it('Creating a New Post', function() {
    cy.visit('/posts/new')     // 1.

    cy.get('input.post-title') // 2.
      .type('My First Post')   // 3.

    cy.get('input.post-body')  // 4.
      .type('Hello, world!')   // 5.

    cy.contains('Submit')      // 6.
      .click()                 // 7.

    cy.url()                   // 8.
      .should('include', '/posts/my-first-post')

    cy.get('h1')               // 9.
      .should('contain', 'My First Post')
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
> 8. Grab the browser URL, ensure it includes `/posts/my-first-post`.
> 9. Find the `h1` tag, ensure it contains the text "My First Post".

This is a relatively simple, straightforward test, but consider how much code has been covered by it, both on the client and the server!

For the remainder of this guide, we'll explore the basics of Cypress that make this example work. We'll demystify the rules Cypress follows so you can productively test your application to act as much like a user as possible, as well as discuss how to take shortcuts when it's useful.

# Querying Elements

## Cypress is Like jQuery

If you've used {% url 'jQuery' https://jquery.com/ %} before, you may be used to querying for elements like this:

```js
$('.my-selector')
```

In Cypress, querying elements is the same:

```js
cy.get('.my-selector')
```

In fact, Cypress {% url 'bundles jQuery' bundled-tools#Other-Library-Utilities %} and exposes many of its DOM traversal methods to you so you can work with complex HTML structures with ease using API's you're already familiar with.

```js
// Each method is equivalent to its jQuery counterpart. Use what you know!
cy.get('#main-content')
  .find('.article')
  .children('img[src^="/static"]')
  .first()
```

{% note success Core Concept %}
Cypress leverages jQuery's powerful selector engine to help make tests familiar and readable for modern web developers.
{% endnote %}

Accessing the DOM elements returned from the query works differently, however:

```js
// This is fine, jQuery returns the element synchronously.
const $jqElement = $('.element')

// This will not work! Cypress does not return the element synchronously.
const $cyElement = cy.get('.element')
```

Let's look at why this is...

## Cypress is _Not_ Like jQuery

**Question:** What happens when jQuery can't find any matching DOM elements from it's selector?

**Answer:** *Oops!* It returns an empty jQuery collection. We've got a real object to work with, but it doesn't contain the element we wanted. So we start adding conditional checks and retrying our queries manually.

```js
// $() returns immediately with an empty collection.
const $myElement = $('.element').first()

// Leads to ugly conditional checks
// and worse - flaky tests!
if ($myElement.length) {
  doSomething($myElement)
}
```

**Question:** What happens when Cypress can't find any matching DOM elements from it's selector?

**Answer:** *No big deal!* Cypress automatically retries the query until either:

***1. The element is found***

```js
cy
  // cy.get() looks for '#element', repeating the query until...
  .get('#element')

  // ...it finds the element!
  // You can now work with it by using .then
  .then(($myElement) => {
    doSomething($myElement)
  })
```

***2. A set timeout is reached***

```js
cy
  // cy.get() looks for '#my-nonexistent-selector', repeating the query until...
  // ...it doesn't find the element before its timeout.
  // Cypress halts and fails the test.
  .get('#element-does-not-exist')

  // ...this code is never run...
  .then(($myElement) => {
    doSomething($myElement)
  })
```

This makes Cypress robust and immune to dozens of common problems that occur in other testing tools. Consider all the circumstances that could cause querying a DOM element to fail:

- The DOM has not loaded yet.
- Your framework hasn't finished bootstrapping.
- An XHR request hasn't responded.
- An animation hasn't completed.
- and on and on...

Before, you'd be forced to write custom code to protect against any and all of these issues: a nasty mashup of arbitrary waits, conditional retries, and null checks littering your tests. Not in Cypress! With built-in retrying and {% url 'customizable timeouts' configuration#Timeouts %}, Cypress sidesteps all of these flaky issues.

{% note success Core Concept %}
Cypress wraps all DOM queries with robust retry-and-timeout logic that better suits how real web apps work. We trade a minor change in how we find DOM elements for a major stability upgrade to all of our tests. Banishing flake for good!
{% endnote %}

{% note info %}
In Cypress, when you want to interact with a DOM element directly, call {% url `.then()` then %} with a callback function that receives the element as it's first argument. When you want to skip the retry-and-timeout functionality entirely and perform traditional synchronous work, use {% url `Cypress.$` $ %}.
{% endnote %}

## Querying by Text Content

Another way to locate things -- a more human way -- is to look them up by their content, by what the user would see on the page. For this, there's the handy {% url `cy.contains()` contains %} command, for example:

```js
// Find an element in the document containing the text 'New Post'
cy.contains('New Post')

// Find an element within '.main' containing the text 'New Post'
cy.get('.main').contains('New Post')
```

This is helpful when writing tests from the perspective of a user interacting with your app. They just know they want to click the button labeled "Submit", they have no idea that it has a `type` attribute of `submit`, or a CSS class of `my-submit-button`.

{% note warning Internationalization %}
If your app is translated into multiple languages for i18n, make sure you consider the implications of using user-facing text to find DOM elements!
{% endnote %}

## When Elements Are Missing

As we showed above, Cypress anticipates the asynchronous nature of web applications and doesn't fail immediately the first time an element is not found. Instead, Cypress gives your app a window of time to finish whatever it may be doing!

This is known as a `timeout`, and most commands can be customized with specific timeout periods ({% url 'the default timeout is 4 seconds' configuration#Timeouts %}). These Commands will list a {% url `timeout` api#Rules %} option in their API documentation, detailing how to set the number of milliseconds you want to continue to try finding the element.

```js
// Give this element 10 seconds to appear
cy.get('.my-slow-selector', { timeout: 10000 })
```

You can also set the timeout globally via the {% url 'configuration setting: `defaultCommandTimeout`' configuration#Timeouts %}.

{% note success Core Concept %}
To match the behavior of web applications, Cypress is asynchronous and relies on timeouts to know when to stop waiting on an app to get into the expected state. Timeouts can be configured globally, or on a per-command basis.
{% endnote %}

{% note info Timeouts and Performance %}
There is a performance tradeoff here: **tests that have longer timeout periods take longer to fail**. Commands always proceed as soon as their expected criteria is met, so working tests will be performed as fast as your application allows. A test that fails due to timeout will consume the entire timeout period, by design. This means that while you _may_ want to increase your timeout period to suit specific parts of your app, you _don't_ want to make it "extra long, just in case".
{% endnote %}

Later in this guide we'll go into much more detail about {% urlHash 'Default Assertions' Default-Assertions %} and {% urlHash 'Timeouts' Timeouts %}

# Chains of Commands

It's very important to understand the mechanism Cypress uses to chain commands together. It manages a Promise chain on your behalf, with each command yielding a subject to the next command, until the chain ends or an error is encountered. The developer should not need to use Promises directly, but understanding how they work is helpful!

## Interacting With Elements

As we saw in the initial example, Cypress makes it easy to click on and type into elements on the page by using {% url `.click()` click %} and {% url `.type()` type %} commands with a {% url `cy.get()` get %} or {% url `cy.contains()` contains %} command. This is a great example of chaining in action. Let's see it again:

```js
cy.get('textarea.post-body')
  .type('This is an excellent post.')
```

We're chaining the {% url `.type()` type %} onto the {% url `cy.get()` get %}, telling it to type into the "subject" yielded from the {% url `cy.get()` get %} command, which will be a DOM element.

Here are even more action commands Cypress provides to interact with your app:

- {% url `.blur()` blur %} - Make a focused DOM element blur.
- {% url `.focus()` focus %} - Focus on a DOM element.
- {% url `.clear()` clear %} - Clear the value of an input or textarea.
- {% url `.check()` check %} - Check checkbox(es) or radio(s).
- {% url `.uncheck()` uncheck %} - Uncheck checkbox(es).
- {% url `.select()` select %} - Select an `<option>` within a `<select>`.
- {% url `.dblclick()` dblclick %} - Double-click a DOM element.

These commands ensure {% url "some guarantees" interacting-with-elements %} about what the state of the elements should be prior to performing their actions.

For example, when writing a {% url `.click()` click %} command, Cypress ensures that the element is able to be interacted with (like a real user would). It will automatically wait until the element reaches an "actionable" state by:

- Not being hidden
- Not being covered
- Not being disabled
- Not animating

This also helps prevent flake when interacting with your application in tests. You can usually override this behavior with a `force` option.

{% note success Core Concept %}
Cypress provides a simple but powerful algorithm when {% url " interacting with elements." interacting-with-elements %}
{% endnote %}

## Asserting About Elements

Assertions let you do things like ensuring an element is visible or has a particular attribute, CSS class, or state. Assertions are just commands that enable you to describe the *desired* state of your application. Cypress will automatically wait until your elements reach this state, or fail the test if the assertions don't pass.  Here's a quick look at assertions in action:

```js
cy.get(':checkbox').should('be.disabled')

cy.get('form').should('have.class', 'form-horizontal')

cy.get('input').should('not.have.value', 'US')
```

In each of these examples, its important to note that Cypress will automatically *wait* until these assertions pass. This prevents you from having to know or care about the precise moment your elements eventually do reach this state.

We'll learn more about {% urlHash 'assertions' Assertions %} later in this guide.

## Subject Management

A new Cypress chain always starts with `cy.[command]`, where what is yielded by the `command` establishes what other commands can be called next (chained).

Some methods yield `null` and thus cannot be chained, such as {% url `cy.clearCookies()` clearcookies %} or {% url `cy.screenshot()` screenshot %}.

Some methods, such as {% url `cy.get()` get %} or {% url `cy.contains()` contains %}, yield a DOM element, allowing further commands to be chained onto them (assuming they expect a DOM subject) like {% url `.click()` click %} or even {% url `cy.contains()` contains %} again.

***Some commands can be chained:***
- From `cy` only, meaning they don't operate on a subject: {% url `cy.clearCookies()` clearcookies %}.
- From commands yielding particular kinds of subjects (like DOM elements): {% url `.type()` type %}.
- From both `cy` *or* from a subject-yielding command: {% url `cy.contains()` contains %}.


***Some commands yield:***
- `null`, meaning no command can be chained after the command: {% url `.screenshot()` screenshot %}.
- The same subject they were originally yielded: {% url `.click()` click %}.
- A new subject, as appropriate for the command {% url `.wait()` wait %}.

This is actually much more intuitive than how it sounds.

***Examples:***

```js
cy.clearCookies()         // Done: 'null' was yielded, no chaining possible

cy.get('.main-container') // Yields an array of matching DOM elements
  .contains('Headlines')  // Yields the first DOM element containing content
  .click()                // Yields same DOM element from previous command
```

{% note success Core Concept %}
Cypress commands do not **return** their subjects, they **yield** them. Remember: Cypress commands are asynchronous and get queued for execution at a later time. During execution, subjects are yielded from one command to the next, and a lot of helpful Cypress code runs between each command to ensure everything is in order.
{% endnote %}

{% note info %}
To work around the need to reference elements, Cypress has a feature {% url 'known as aliasing' aliases-and-references %}. Aliasing  helps you to **store** and **save** element references for future use.
{% endnote %}

***Using {% url `.then()` then %} To Act On A Subject***

Want to jump into the command flow and get your hands on the subject directly? No problem, simply add a {% url '`.then()`' type %} to your command chain. When the previous command resolves, it will call your callback function with the yielded subject as the first argument.

If you wish to continue chaining commands after your {% url `.then()` then %}, you'll need to specify the subject you want to yield to those commands, which you can achieve with a simple return value other than `null` or `undefined`. Cypress will yield that to the next command for you.

***Let's look at an example:***

```js
cy
  // Find the el with id 'some-link'
  .get('#some-link')

  .then(($myElement) => {
    // ...massage the subject with some arbitrary code

    // grab its href property
    const href = $myElement.prop('href')

    // strip out the 'hash' character and everything after it
    return href.replace(/(#.*)/, '')
  })
  .then((href) => {
    // href is now the new subject
    // which we can work with now
  })
```

***Using Aliases to Refer to Previous Subjects***

Cypress has some added functionality for quickly referring back to past subjects called {% url 'Aliases' aliases-and-references %}. It looks something like this:

```js
cy
  .get('.my-selector')
  .as('myElement') // sets the alias
  .click()

/* many more actions */

cy
  .get('@myElement') // re-queries the DOM as before (only if necessary)
  .click()
```

This lets us reuse our DOM queries for faster tests when the element is still in the DOM, and it automatically handles re-querying the DOM for us when it is not immediately found in the DOM. This is particularly helpful when dealing with front-end frameworks that do a lot of re-rendering!

## Commands Are Asynchronous

It is very important to understand that Cypress commands don't do anything at the moment they are invoked, but rather enqueue themselves to be run later. This is what we mean when we say Cypress commands are asynchronous.

***Take this simple test, for example:***

```js
it('changes the URL when "awesome" is clicked', function() {
  cy.visit('/my/resource/path') // Nothing happens yet

  cy.get('.awesome-selector')   // Still nothing happening
    .click()                    // Nope, nothing

  cy.url()                      // Nothing to see, yet
    .should('include', '/my/resource/path#awesomeness') // Nada.
})

// Ok, the test function has finished executing...
// We've queued all of these commands and now
// Cypress will begin running them in order!
```

Cypress doesn't kick off the browser automation magic until the test function exits.

{% note success Core Concept %}
Each Cypress command (and chain of commands) returns immediately, having only appended to a queue of commands to be executed at a later time.

You purposefully **cannot** do anything useful with the return value from a command. Commands are enqueued and managed entirely behind the scenes.

We've designed our API this way because the DOM is a highly mutable object that constantly goes stale. For Cypress to prevent flake, and know when to proceed, we manage commands in a highly controlled deterministic way.
{% endnote %}

{% note info "Why can't I use async / await?" %}
If you're a modern JS programmer you might hear "asynchronous" and think: **why can't I just use `async/await`** instead of learning some proprietary API?

Cypress's APIs are built very differently from what you're likely used to: but these design patterns are incredibly intentional. We'll go into more detail later in this guide.
{% endnote %}

## Commands Run Serially

After a test function is finished running, Cypress goes to work executing the commands that were enqueued using the `cy.*` command chains. The test above would cause an execution in this order:

1. Visit a URL.
2. Find an element by its selector.
3. Perform a click action on that element.
4. Grab the URL.
5. Assert the URL to include a specific *string*.

These actions will always happen serially (one after the other), never in parallel (at the same time). Why?

To illustrate this, let's revisit that list of actions and expose some of the hidden **✨ magic ✨** Cypress does for us at each step:

1. Visit a URL
  ✨ **and wait for the page `load` event to fire after all external resources have loaded**✨
2. Find an element by its selector
  ✨ **and retry repeatedly until it is found in the DOM** ✨
3. Perform a click action on that element
  ✨ **after we wait for the element to reach an {% url 'actionable state' interacting-with-elements %}** ✨
4. Grab the URL and...
5. Assert the URL to include a specific *string*
  ✨ **and retry repeatedly until the assertion passes** ✨

As you can see, Cypress does a lot of extra work to ensure the state of the application matches what our commands expect about it. Each command may resolve quickly (so fast you won't see them in a pending state) but others may take seconds, or even dozens of seconds to resolve.

While most commands time out after a few seconds, other specialized commands that expect particular things to take much longer like {% url `cy.visit()` visit %} will naturally wait longer before timing out.

These commands have their own particular timeout values which are documented in our {% url 'configuration' configuration %}.

{% note success Core Concept %}
Any waiting or retrying that is necessary to ensure a step was successful must complete before the next step begins. If they don't complete successfully before the timeout is reached, the test will fail.
{% endnote %}

## Commands Are Promises

This is the big secret of Cypress: we've taken our favorite pattern for composing JavaScript code, Promises, and built them right into the fabric of Cypress. Above, when we say we're enqueuing actions to be taken later, we could restate that as "adding Promises to a chain of Promises".

Let's compare the prior example to a fictional version of it as raw, Promise-based code:

***Noisy Promise demonstration. Not valid code.***

```js
it('changes the URL when "awesome" is clicked', function() {
  // THIS IS NOT VALID CODE.
  // THIS IS JUST FOR DEMONSTRATION.
  return cy.visit('/my/resource/path')
  .then(() => {
    return cy.get('.awesome-selector')
  })
  .then(($element) => {
    // not analogous
    return cy.click($element)
  })
  .then(() => {
    return cy.url()
  })
  .then((url) => {
    expect(url).to.eq('/my/resource/path#awesomeness')
  })
})
```

***How Cypress really looks, Promises wrapped up and hidden from us.***

```javascript
it('changes the URL when "awesome" is clicked', function() {
  cy.visit('/my/resource/path')

  cy.get('.awesome-selector')
    .click()

  cy.url()
    .should('include', '/my/resource/path#awesomeness')
})
```

Big difference! In addition to reading much cleaner, Cypress does more than this, because **Promises themselves have no concepts of retry-ability**.

Without **retry-ability**, assertions would randomly fail. This would lead to flaky inconsistent results. This is also why we cannot use new JS features like `async / await`.

Cypress cannot yield you primitive values isolated away from other commands. That is because Cypress commands act internally like an asynchronous stream of data that only resolve after being affected and modified **by other commands**. This means we cannot yield you discrete values in chunks because we have to know everything about what you expect before handing off a value.

These design patterns ensure we can create **deterministic**, **repeatable**, **consistent** tests that are **flake free**.

{% note info %}
Cypress is built using Promises that come from {% url "Bluebird" http://bluebirdjs.com/ %}. However, Cypress commands do not return these typical Promise instances. Instead we return what's called a `Chainer` that acts like a layer sitting on top of the internal Promise instances.
{% endnote %}

## Commands Are Not Promises

The Cypress API is not an exact 1:1 implementation of Promises. They have Promise like qualities and yet there are important differences you should be aware of.

1. You cannot **race** or run multiple commands at the same time (in parallel).
2. You cannot 'accidentally' forget to return or chain a command.
3. You cannot add a `.catch` error handler to a failed command.

There are *very* specific reasons these limitations are built into the Cypress API.

The whole intention of Cypress (and what makes it very different from other testing tools) is to create consistent, non-flaky tests that perform identically from one run to the next. Making this happen isn't free - there are some trade-offs we make that may initially seem unfamiliar to developers accustom to working with Promises.

Let's take a look at each trade-off in depth:

***You cannot race or run multiple commands at the same time***

Cypress guarantees that it will execute all of its commands *deterministically* and identically every time they are run.

A lot of Cypress commands *mutate* the state of the browser in some way.

- {% url `cy.request()` request %} automatically gets + sets cookies to and from the remote server.
- {% url `cy.clearCookies()` clearcookies %} clears all of the browser cookies.
- {% url `.click()` click %} causes your application to react to click events.

None of the above commands are *idempotent*, they all cause side effects. Racing commands is not possible because commands must be run in a controlled, serial manner in order to create consistency. Because integration and e2e tests primarily mimic the actions of a real user, Cypress models its command execution model after a real user working step by step.

***You cannot accidentally forget to return or chain a command***

In real promises it's very easy to 'lose' a nested Promise if you don't return it or chain it correctly.

Let's imagine the following `node.js` code:

```js
// assuming we've promisified our fs module
return fs.readFile('/foo.txt', 'utf8')
.then((txt) => {
  // oops we forgot to chain / return this Promise
  // so it essentially becomes 'lost'.
  // this can create bizarre race conditions and
  // bugs that are difficult to track down
  fs.writeFile('/foo.txt', txt.replace("foo", "bar"))

  return fs.readFile("/bar.json")
  .then((json) => {
    // ...
  })
})
```

The reason this is even possible to do in the Promise world is because you have the power to execute multiple asynchronous actions in parallel. Under the hood, each promise 'chain' returns a promise instance that tracks the relationship between linked parent and child instances.

Because Cypress enforces commands to run *only* serially, you do not need to be concerned with this in Cypress. We enqueue all commands onto a *global* singleton. Because there is only ever a single command queue instance, its impossible for commands to ever be *'lost'*.

You can think of Cypress as "queueing" every command. Eventually they'll get run and in the exact order they were used, 100% of the time.

There is no need to ever `return` Cypress commands.

***You cannot add a `.catch` error handler to a failed command***

In Cypress there is no built in error recovery from a failed command. A command and its assertions all *eventually* pass, or if one fails, all remaining commands are not run, and the test fails.

You might be wondering:

> How do I create control flow, using if/else? So that if an element does (or doesn't) exist, I choose what to do?

The problem with this question is that this type of control flow ends up being non-deterministic. This means its impossible for a script (or robot), to follow it 100% consistently.

In general, there are only a handful of very specific situations where you *can* create control flow. Asking to recover from errors is actually just asking for another `if/else` control flow.

With that said, as long as you are aware of the potential pit falls with control flow, it is possible to do this in Cypress!

{% note info %}
We're working on a new guide for showing you how to manage and create "control flow" in your tests.
{% endnote %}

# Assertions

As we mentioned previously in this guide:

> Assertions describe the **desired** state of your **elements**, your **objects**, and your **application**.

What makes Cypress unique from other testing tools is that commands **automatically retry** their assertions. In fact, they will look "downstream" at what you're expressing and modify their behavior to make your assertions pass.

You should think of assertions as **guards**.

Use your **guards** to describe what your application should look like, and Cypress will automatically **block, wait, and retry** until it reaches that state.

{% note success 'Core Concept' %}
Each API Command documents its behavior with assertions - such as how it retries or waits for assertions to pass.
{% endnote %}

## Asserting in English

Let's look at how you'd describe an assertion in english:

> After clicking on this `<button>`, I expect it's class to eventually be `active`.

To express this in Cypress you'd write:

```js
cy.get('button').click().should('have.class', 'active')
```

This above test will pass even if the `.active` class is applied to the button asynchronously - or after a indeterminate period of time.

```javascript
// even though we are adding the class
// after two seconds...
// this test will still pass!
$('button').on('click', (e) => {
  setTimeout(() => {
    $(e.target).addClass('active')
  }, 2000)
})
```

Here's another example.

> After making an HTTP request to my server, I expect the response body to equal `{name: 'Jane'}`

To express this with an assertion you'd write:

```js
cy.request('/users/1').its('body').should('deep.eq', {name: 'Jane'})
```

## When To Assert?

Despite the dozens of assertions Cypress makes available to you, sometimes the best test may make no assertions at all! How can this be? Aren't assertions a basic part of testing?

***Consider this example:***

```js
cy.visit('/home')

cy.get('.main-menu')
  .contains('New Project')
  .click()

cy.get('.title')
  .type('My Awesome Project')

cy.get('form')
  .submit()
```

Without a single explicit assertion, there are dozens of ways this test can fail! Here's a few:

- The initial {% url `cy.visit()` visit %} could respond with something other than success.
- Any of the {% url `cy.get()` get %} commands could fail to find their elements in the DOM.
- The element we want to {% url `.click()` click %} on could be covered by another element.
- The input we want to {% url `.type()` type %} into could be disabled.
- Form submission could result in a non-success status code.
- The in-page JS (the application under test) could throw an error.

Can you think of any more?

{% note success Core Concept %}
With Cypress, you don't have to assert to have a useful test. Even without assertions, a few lines of Cypress can ensure thousands of lines of code are working properly across the client and server!

This is because many commands have a built in {% urlHash 'Default Assertion' Default-Assertions %} which offer you a high level of guarantee.
{% endnote %}

## Default Assertions

Many commands have a default, built-in assertion, or rather have requirements that may cause it to fail without needing an explicit assertion you've added.

***For instance:***

- {% url `cy.visit()` visit %} expects the page to send `text/html` content with a `200` status code.
- {% url `cy.request()` request %} expects the remote server to exist and provide a response.
- {% url `cy.contains()` get %} expects the element with content to eventually exist in the DOM.
- {% url `cy.get()` get %} expects the element to eventually exist in the DOM.
- {% url `.find()` find %} also expects the element to eventually exist in the DOM.
- {% url `.type()` type %} expects the element to eventually be in a *typeable* state.
- {% url `.click()` click %} expects the element to eventually be in an *actionable* state.
- {% url `.its()` its %} expects to eventually find a property on the current subject.

Certain commands may have a specific requirement that causes them to immediately fail without retrying: such as {% url `cy.request()` request %}.

Others, such as DOM based commands will automatically retry and wait for their corresponding elements to exist before failing.

Even more - action commands will automatically wait for their element to reach an {% url 'actionable state' interacting-with-elements %} before failing.

{% note success Core Concept %}
All DOM based commands automatically wait for their elements to exist in the DOM.

You **never** need to write {% url "`.should('exist')`" should %} after a DOM based command.
{% endnote %}

These rules are pretty intuitive, and most commands give you flexibility to override or bypass the default ways they can fail, typically by passing a `{force: true}` option.

***Example #1: Existence and Actionability***

```js
cy
  // there is a default assertion that this
  // button must exist in the DOM before proceeding
  .get('button')

  // before issuing the click, this button must be "actionable"
  // it cannot be disabled, covered, or hidden from view.
  .click()
```

Cypress will automatically *wait* for elements to pass their default assertions. Just like with explicit assertions you've added, all of these assertions share the *same* timeout values.

***Example #2: Reversing the Default Assertion***

Most of the time, when querying for elements you expect them to eventually exist. But sometimes you wish to wait until they *don't* exist.

All you have to do is add that assertion and Cypress will **reverse** its rules waiting for elements to exist.

```js
// now Cypress will wait until this
// <button> is not in the DOM after the click
cy.get('button.close').click().should('not.exist')

// and now make sure this #modal does not exist in the DOM
// and automatically wait until it's gone!
cy.get('#modal').should('not.exist')
```

{% note success 'Core Concept' %}
By adding {% url "`.should('not.exist')`" should %} to any DOM command, Cypress will reverse its default assertion and automatically wait until the element does not exist.
{% endnote %}

***Example #3: Other Default Assertions***

Other commands have other default assertions not related to the DOM.

For instance {% url `.its()` its %} requires that the property you're asking about exists on the object.

```js
// create an empty object
const obj = {}

// set the 'foo' property after 1 second
setTimeout(() => {
  obj.foo = 'bar'
}, 1000)

// .its() will wait until the 'foo' property is on the object
cy.wrap(obj).its('foo')
```

## List of Assertions

Cypress bundles {% url "`Chai`" bundled-tools#Chai %}, {% url "`Chai-jQuery`" bundled-tools#Chai-jQuery %}, and {% url "`Sinon-Chai`" bundled-tools#Sinon-Chai %} to provide built-in assertions. You can see a comprehensive list of them in {% url 'the list of assertions reference' assertions %}. You can also {% url "write your own assertions as Chai plugins" extending-cypress-recipe %} and use them in Cypress.

## Writing Assertions

There are two ways to write assertions in Cypress:

1. **Implicit Subjects:** Using {% url `.should()` should %} or {% url `.and()` and %}.
2. **Explicit Subjects:** Using `expect`.

## Implicit Subjects

Using {% url `.should()` should %} or {% url `.and()` and %} commands is the preferred way of making assertions in Cypress. These are typical Cypress commands, which means they apply to the currently yielded subject in the command chain.

```javascript
// the implicit subject here is the first <tr>
// this asserts that the <tr> has an .active class
cy.get('tbody tr:first').should('have.class', 'active')
```

You can chain multiple assertions together using {% url `.and()` and %}, which is just another name for {% url `.should()` should %} that makes things more readable:

```js
cy.get('#header a')
  .should('have.class', 'active')
  .and('have.attr', 'href', '/users')
```

Because {% url "`.should('have.class', ...)`" should %} does not change the subject, the {% url "`.and('have.attr', ...)`" and %} is executed against the same element. This is handy when you need to assert multiple things against a single subject quickly, but there are pitfalls...

{% note danger Beware: Assertions That Change The Subject %}
Some assertions modify the current subject unexpectedly. For example,
`cy.get('a').should('have.attr', 'href', '/users')` modifies the subject from the `<a>` element to the string `'/users'`.

This is because Cypress honors the return value of the assertion, and `have.attr` is a {% url "`Chai-jQuery`" assertions#Chai-jQuery %} assertion that returns the matched string instead of the original subject. This can be surprising!

Whenever you have failing assertions and don't understand why, click the command in the Cypress {% url "Command Log" overview-of-the-gui#Command-Log %}. Cypress will print details to the browser console to help you troubleshoot what is going on.
{% endnote %}

If we wrote this assertion in the explicit form "the long way", it would look like this:

```js
cy.get('tbody tr:first').should(($tr) => {
  expect($tr).to.have.class('active')
  expect($tr).to.have.attr('href', '/users')
})
```

The implicit form is much shorter! So when would you want to use the explicit form?

Typically when you want to:
  - Assert multiple things about the same subject
  - Massage the subject in some way prior to making the assertion

## Explicit Subjects

Using `expect` allows you to pass in a specific subject and make an assertion about it. This is probably how you're used to seeing assertions written in unit tests:

```js
// the explicit subject here is the boolean: true
expect(true).to.be.true
```

{% note info Did you know you can write Unit Tests in Cypress? %}
Check out our example recipes for {% url 'unit testing' unit-testing-recipe %} and {% url 'unit testing React components' unit-testing-recipe %}
{% endnote %}

Explicit assertions are great when you want to:

- Perform custom logic prior to making the assertion.
- Make multiple assertions against the same subject.

The {% url `.should()` should %} command allows us to pass a callback function that takes the yielded subject as it's first argument. This works just like {% url `.then()` then %}, except Cypress automatically **waits and retries** for everything inside of the callback function to pass.

{% note info 'Complex Assertions' %}
The example below is a use case where we are asserting across multiple elements. Using a {% url `.should()` should %} callback function is a great way to query from a **parent** into multiple children elements and assert something about their state.

Doing so enables you to **block** and **guard** Cypress by ensuring the state of descendants matches what you expect without needing to query them individually with regular Cypress DOM commands.
{% endnote %}

```javascript
cy
  .get("p")
  .should(($p) =>{
    // massage our subject from a DOM element
    // into an array of texts from all of the p's
    var texts = $p.map((i, el) => {
      return Cypress.$(el).text()
    })

    // jquery map returns jquery object
    // and .get() converts this to a simple array
    var texts = texts.get()

    // array should have length of 3
    expect(texts).to.have.length(3)

    // with this specific content
    expect(texts).to.deep.eq([
      'Some text from first p',
      'More text from second p',
      'And even more text from third p'
    ])
})
```

{% note danger Make sure `.should()` is safe %}
When using a callback function with {% url `.should()` should %}, be sure that the entire function can be executed multiple times without side effects. Cypress applies its retry logic to these functions: if there's a failure, it will repeatedly rerun the assertions until the timeout is reached. That means your code should be retry-safe. The technical term for this means your code must be **idempotent**.
{% endnote %}

# Timeouts

Almost all commands can time out in some way.

All assertions, whether they're the default ones or whether they've been added by you all share the same timeout values.

## Applying Timeouts

You can modify a command's timeout. This timeout affects both it's default assertions (if any) and any specific assertions you've added.

Remember because assertions are used to describe a condition of the previous commands - the `timeout` modification goes on the previous commands *not the assertions*.

***Example #1: Default Assertion***

```js
// because .get() has a default assertion
// that this element exists, it can time out and fail
cy.get('.mobile-nav')
```

Under the hood Cypress:

- Queries for the element `.mobile-nav`
  ✨**and waits up to 4 seconds for it to exist in the DOM**✨

***Example #2: Additional Assertions***

```js
// we've added 2 assertions to our test
cy
  .get('.mobile-nav')
  .should('be.visible')
  .and('contain', 'Home')
```

Under the hood Cypress:

- Queries for the element `.mobile-nav`
  ✨**and waits up to 4 seconds for it to exist in the DOM**✨
  ✨**and waits up to 4 seconds for it to be visible**✨
  ✨**and waits up to 4 seconds for it to contain the text: 'Home'**✨

The *total* amount of time Cypress will wait for *all* of the assertions to pass is for the duration of the {% url "`cy.get()`" get %} `timeout` (which is 4 seconds).

Timeouts can be modified per command and this will affect all default assertions and any assertions chained after that command.

***Example #3: Modifying Timeouts***

```js
// we've modified the timeout which affects default + added assertions
cy
  .get('.mobile-nav', { timeout: 10000 })
  .should('be.visible')
  .and('contain', 'Home')
```

Under the hood Cypress:

- Gets the element `.mobile-nav`
  ✨**and waits up to 10 seconds for it to exist in the DOM**✨
  ✨**and waits up to 10 seconds for it to be visible**✨
  ✨**and waits up to 10 seconds for it to contain the text: 'Home'**✨

Notice that this timeout has flowed down to all assertions and Cypress will now wait *up to 10 seconds total* for all of them to pass.

## Default Values

Cypress offers several different timeout values based on the type of command.

We've set their default timeout durations based on how long we expect certain actions to take.

For instance:
- {% url `cy.visit()` visit %} loads a remote page and does not resolve *until all of the external resources complete their loading phase*. This may take awhile, so it's default timeout is set to `60000ms`.
- {% url `cy.exec()` exec %} runs a system command such as *seeding a database*. We expect this to potentially take a long time, and it's default timeout is set to `60000ms`.
- {% url `cy.wait()` wait %} actually uses 2 different timeouts. When waiting for a {% url 'routing alias' aliases-and-references#Aliasing-Routes %}, we wait for a matching request for `5000ms`, and then additionally for the server's response for `30000ms`. We expect your application to make a matching request quickly, but we expect the server's response to potentially take much longer.

That leaves most other commands including all DOM based commands to time out by default after 4000ms.

***Why only 4 seconds? That sounds low!***

If you've used other testing frameworks, you might wonder why this value is so low. In fact we regularly see our some users initially increasing it sometimes up to 25x!

You shouldn't need to wait for your application to render DOM elements for more than 4 seconds!

Let's look at why you're likely wanting to increase this, and some best practices.

The most common scenario is that DOM elements render *after* a series of network requests. The network requests themselves must go over the internet, leaving them susceptible to be potentially slow.

One of the typical anti-patterns we see is not properly

One of the typical hurdles you will need to overcome is *slow tests*.
