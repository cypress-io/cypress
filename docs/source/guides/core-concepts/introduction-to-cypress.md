---
title: Introduction to Cypress
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- What Cypress looks like
- How Cypress queries the DOM differently than other testing frameworks
- How Cypress manages subjects and chains of commands
- What assertions look like and how they work
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
> 9. Find the `<h1>` tag, ensure it contains the text "My First Post".

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

In fact, Cypress {% url 'wraps jQuery' bundled-tools#Other-Library-Utilities %} and exposes many of its DOM traversal methods to you so you can work with complex HTML structures with ease using API's you're already familiar with.

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
let $jqElement = $('.my-selector')

// This will not work! Cypress does not return the element synchronously.
let $cyElement = cy.get('.my-selector')
```

Let's look at why this is...

## Cypress is _Not_ Like jQuery

**Question:** What happens when jQuery can't find any matching DOM elements from it's selector?

**Answer:** *Oops!* It returns an empty jQuery collection. We've got a real object to work with, but it doesn't contain the element we wanted. So we start adding conditional checks and retrying our queries manually.

```js
// $() returns immediately with an empty collection.
let $myElement = $('.my-selector').first()

// Leads to errors or ugly conditional checks
if ($myElement.length) {
  doSomething($myElement)
}
```

**Question:** What happens when Cypress can't find any matching DOM elements from it's selector?

**Answer:** *No big deal!* Cypress automatically retries the query until either:

***1. The element is found***

```js
// cy.get() looks for '#my-selector', repeating the query until...
cy.get('#my-selector')
  // ...it finds the element!
  // You can now work with it by using .then
  .then(function($myElement) {
    doSomething($myElement)
  })
```

***2. A set timeout is reached***

```js
// cy.get() looks for '#my-nonexistent-selector', repeating the query until...
cy.get('#my-nonexistent-selector')
  // ...it doesn't find the element before its timeout.
  // Cypress halts and fails the test.
  // No null checks necessary because no other commands run in this test!
  .then(function($myElement) {
    doSomething($myElement) // this code is never run
  })


```

This makes Cypress robust and immune to dozens of common problems that occur in other testing tools. Consider all the circumstances that could cause the querying a DOM element to fail:

- The DOM has not loaded yet.
- Your framework hasn't finished bootstrapping.
- An XHR hasn't completed.
- An animation hasn't completed.
- and on and on...

Before, you'd be forced to write custom code to protect against any and all of these issues: a nasty mashup of arbitrary waits, conditional retries, and null checks littering your code. Not in Cypress! With built-in retrying and {% url 'customizable timeouts' configuration#Timeouts %}, Cypress sidesteps all of these flaky issues.

{% note success Core Concept %}
Cypress wraps all DOM queries with robust retry-and-timeout logic that better suits how real web apps work. We trade a minor change in how we find DOM elements for a major stability upgrade to all our tests. Banishing flake for good!
{% endnote %}

{% note info %}
In Cypress, when you want to interact with a DOM element directly, call {% url `.then()` then %} and pass a callback function to it that will receive the element as it's first argument. When you need to skip the retry-and-timeout functionality entirely and perform a traditional, synchronous query, you can still use {% url `Cypress.$` $ %}.
{% endnote %}

## Querying by Text Content

Another way to locate things -- a more human way -- is to look them up by their contents, by what the user would see on the page. For this, there's the handy {% url `cy.contains()` contains %}, for example:

```js
// Find an element in the document containing the text 'New Post'
cy.contains('New Post')

// Find a child element of the '.main' element containing the text 'New Post'
cy.get('.main').contains('New Post')
```

This is helpful when writing tests from the perspective of a user interacting with your app. They just know they want to click the button labeled "Submit", they have no idea that it has a `type` attribute of `submit`, or a CSS class of `my-submit-button`.

{% note warning Localization %}
If your app is translated into multiple languages, make sure you consider the implications of using user-facing text to find DOM elements!
{% endnote %}

## When Elements Are Missing

As we showed above, Cypress anticipates the asynchronous nature of web applications and doesn't fail immediately when the first time an element is not found. Instead, Cypress gives your app a window of time to finish whatever it may be doing!

This is known as a `timeout`, and most commands may be customized with specific timeout periods ({% url 'the default timeout is 4 seconds' configuration#Timeouts %}). These Commands will list a `timeout` option in their API documentation, detailing how to set the number of milliseconds you want to continue to try finding the element.

```js
// Give this selector 10 seconds to appear
cy.get('.my-slow-selector', { timeout: 10000 })
```

You can also set the timeout globally via [the configuration setting:  `defaultCommandTimeout`](/guides/appendices/configuration.html#Timeouts).

{% note success Core Concept %}
To match the behavior of web applications, Cypress is asynchronous and relies on timeouts to know when to stop waiting on an app to get into the expected state. Timeouts can be configured globally, or on a per-command basis.
{% endnote %}

{% note info Timeouts and Performance %}
There is a performance tradeoff here: **tests that have longer timeout periods take longer to fail**. Commands always proceed as soon as their expected criteria is met, so working tests will be performed as fast as your application allows. A test that fails due to timeout will consume the entire timeout period, by design. This means that while you _may_ want to increase your timeout period to suit specific parts of your app, you _don't_ want to make it "extra long, just in case".
{% endnote %}

Later in this guide we'll go into much more detail about {% urlHash 'Default Assertions' Default-Assertions %} and {% urlHash 'Timeouts' Timeouts %}

# Chains of Commands

It's very important to understand the mechanism Cypress uses to chain commands together. It manages a Promise chain on your behalf, with each command yielding a subject to the next command, until the chain ends or an error is encountered. The developer should not need to use Promises directly, but understanding how they work is very helpful!

## Interacting With Elements

As we saw in the initial example, Cypress makes it easy to click on and type into elements on the page by using {% url `.click()` click %} and {% url `.type()` type %} commands with a {% url `cy.get()` get %} or {% url `cy.contains()` contains %} command. This is a great example of chaining in action. Let's see it again:

```js
cy.get('textarea.post-body')
  .type('This is an excellent post.')
```

We're chaining the {% url `.type()` type %} onto the {% url `cy.get()` get %}, applying it to the "subject" yielded from the {% url `cy.get()` get %} command, which will be a DOM element.

Here are even more action commands Cypress provides to interact with your app:

> {% url `.blur()` blur %}
> {% url `.focus()` focus %}
> {% url `.type()` type %}
> {% url `.clear()` clear %}
> {% url `.check()` check %}
> {% url `.uncheck()` uncheck %}
> {% url `.select()` select %}
> {% url `.dblclick()` dblclick %}

These commands make some assumptions about the what the state of the elements should be.

For examples, when writing a `.click()` command, Cypress ensures that the element is able to be interacted with and will fail in some situations it deems not this is not the case like the element:

- Not being visible
- Being covered by another element
- Being disabled

This also helps prevent flake when interacting with your application in tests. You can usually override this behavior with a `force` option.

{% note success Core Concept %}
Cypress exposes common user interactions as commands, making it simple to encapsulate the behaviors you're looking to create. It also expects these commands to be acting on an element that can be interacted with.
{% endnote %}

## Asserting About Elements

Assertions let you do things like ensuring an element is visible or has a particular attribute, CSS class, or child. Assertions are just commands that enable you to describe the **desired** state of your application. Cypress will automatically wait until your elements reach this state, or halt the test if the assertions don't pass.  Here's a quick look at assertions in action:

```js
cy.get(':checkbox').should('be.disabled')

cy.get('form').should('have.class', 'form-horizontal')

cy.get('input').should('not.have.value', 'US')
```

In each of these examples, its important to note that Cypress will automatically *wait* until these assertions pass. This prevents you from having to know or care about the precise moment your elements eventually do reach this state.

We'll learn more about assertions later in this guide.

## Subject Management

A new Cypress chain always starts with `cy.[command]`, where what is yielded by the `command` establishes what other commands can be called next (chained).

Some methods yield `null` and thus cannot be chained, such as {% url `cy.clearCookies()` clearcookies %} or {% url `cy.screenshot()` screenshot %}.

Some methods, such as {% url `cy.get()` get %} or {% url `cy.contains()` contains %}, yield a DOM element, allowing further commands to be chained onto them (assuming they expect a DOM subject) like {% url `.click()` click %} or even {% url `cy.contains()` contains %} again.

***Some commands can be chained:***
- From `cy` only, meaning they don't operate on a subject: {% url `cy.clearCookies()` clearcookies %}
- From commands yielding particular kinds of subjects (like DOM elements): {% url `.type()` type %}
- From both `cy` *or* from a subject-yielding command: {% url `cy.contains()` contains %}


***Some commands yield:***
- `null`, meaning no command can be chained after the command: {% url `.screenshot()` screenshot %}
- The same subject they were originally yielded: {% url `.then()` then %}
- A new subject, as appropriate for the command {% url `.wait()` wait %}

This is actually much more intuitive than how it sounds.

Examples:

```js
cy.clearCookies()             // Done: 'null' was yielded, thus no chaining possible

cy.get('.main-container')     // Yields an array of matching DOM elements
  .contains('Headlines')      // Yields the first DOM element containing content
  .click()                    // Yields same DOM element from previous command
```

{% note success Core Concept %}
Cypress commands do not **return** their subjects, they **yield** them. Remember: Cypress commands are asynchronous and get queued for execution at a later time. During execution, subjects are yielded from one command to the next, and a lot of helpful Cypress code runs between each command to ensure everything is in order.
{% endnote %}

{% note info %}
To work around the need to reference elements, Cypress has a feature {% url 'known as aliasing' aliases-and-references %}. Aliasing  helps you to **store** and **save** element references for future use.
{% endnote %}

**Using {% url `.then()` then %} To Act On A Subject**

Want to jump into the command flow and get your hands on the subject directly? No problem, simply add a {% url '`.then((subject) => { ... })`' type %} to your command chain. When the previous command resolves, it will call your callback function with the yielded subject as the first argument.

If you wish to continue chaining commands after your {% url `.then()` then %}, you'll need to specify the subject you want to yield to those commands, which you can achieve by a simple return value other than `null` or `undefined`. Cypress will yield that to the next command for you.

***Let's look at an example:***

```js
cy.get('#some-link') // Find the el with id 'some-link'
  .then(function($myElement) {
    // Extract its href as a string
    let linkDestination = $myElement.attr('href')
    // This string is yielded into the next command in the chain
    return linkDestination
  }).should('equal', 'http://example.com') // .should works against Strings!
```

**Using Aliases to Refer to Previous Subjects**

Cypress has some added functionality for quickly referring back to past DOM element subjects called [Aliases](/guides.html). It looks something like this:

```js
cy.get('.my-selector')
  .as('myElement') // sets the alias
  .click()

/* many more actions */

cy.get('@myElement') // re-queries the DOM as before only if necessary
  .click()
```

This lets us reuse our DOM queries for faster tests when the element is still in the DOM, and it automatically handles re-querying the DOM for us when it is not in the DOM. This is particularly helpful when dealing with front-end frameworks that do a lot of re-rendering!

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

We've designed our API's this way because the DOM is a highly mutable object which constantly goes stale. For Cypress to prevent flake, and know when to proceed, it must manage commands in a highly controlled deterministic way.
{% endnote %}

## Commands Run Serially

After a test function is finished running, Cypress goes to work executing the commands that were enqueued using the `cy.*` command chains. The test above would cause an execution in this order:

1. Visit a URL
2. Find an element by its selector
3. Perform a click action on that element
4. Grab the URL
5. Assert the URL to include a specific *string*

These actions will always happen serially (one after the other), never in parallel (at the same time). Why? To illustrate this, let's revisit that list of actions and expose some of the hidden magic Cypress does for us at each step:

1. Visit a URL
  - **and wait for the `onload` event to fire after all external resources have loaded**
2. Find an element by its selector
  - **and retry repeatedly until it is found in the DOM**
3. Perform a click action on that element
  - **after we first ensure that element is 'actionable' by not being covered, hidden, or disabled**
4. Grab the URL
  - **then pass this URL to the subsequent assertion**
5. Assert the URL to include a specific *string*
  - **and retry repeatedly until the assertion passes**

As you can see, Cypress does a lot of extra work to ensure the state of the application matches what our commands expect about it. Each command may resolve quickly (so fast you won't see them in a pending state) but others may take seconds, or even dozens of seconds to resolve.

While most commands time out after a few seconds, other specialized commands that expect particular things to take much longer like {% url `cy.visit` visit %} will naturally wait considerably longer before timing out.

These commands have their own particular timeout values which are documented in our {% url 'configuration' configuration %}.

{% note success Core Concept %}
Any waiting or retrying that is necessary to ensure a step was successful must complete before the next step begins. If they don't complete successfully before the timeout is reached, the test will fail.
{% endnote %}

## Commands Are Promises

This is the big secret of Cypress: we've taken our favorite pattern for composing JavaScript code, Promises, and built them right into the fabric of Cypress. Above, when we say we're enqueuing actions to be taken later, we could restate that as "adding Promises to the Promise chain".

We do this under the hood to free the end user from having to master the Promise pattern up front: no importing Promise libraries, no remembering which methods are available and their signatures, and no forgetting to return every Promise; Cypress does all this for you.

Let's compare the prior example to a fictional version of it as raw, Promise-based code:

***Noisy Promise demonstration. Not valid code.***

```js
it('changes the URL when "awesome" is clicked', function() {
  // THIS IS NOT VALID CODE.
  // THIS IS JUST FOR DEMONSTRATION.
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

Big difference! The Promise demonstration is not real code (so don't try it), but it gives an idea the magnitude of what Cypress handles for you behind the scenes. In reality, Cypress does more than this, because Promises themselves have no concepts of retry-ability.

Normal assertions would fail instantly and you'd get inconsistent (flaky) results. By embracing Cypress's API you can rest assured that we're doing everything in our power to prevent flake.

{% note success Core Concept %}
Cypress is built using Promises internally (with Bluebird), but you (the developer testing with Cypress) should not have to wrap or reach for your own custom Promises the vast majority of the time.
{% endnote %}

## Commands Are Not Promises

The Cypress API is not an exact 1:1 implementation of Promises. They have Promise like qualities and yet there are important differences you should be aware of.

1. You cannot **race** or run multiple commands at the same time (in parallel)
2. You cannot 'accidentally' forget to return or chain a command
3. You cannot add a `.catch` error handler to a failed command

There are *very* specific reasons these limitations are built into the Cypress API (it's not like we just forgot to implement those features).

The whole point of Cypress (and what makes it very different from other tools) is to create consistent, non-flaky tests that perform identically from one run to next. Making this happen isn't free - there are some trade-offs we must make that may initially seem unfamiliar to developers accustom to working with Promises.

Let's take a look at each one in depth:

***You cannot race or run multiple commands at the same time***

Cypress gives us **guarantee** that it will execute all of its commands **deterministically** and identically the same way every single time.

Most Cypress commands *mutate* the state of the browser in some way.

- {% url `cy.request()` request %} automatically gets + sets cookies to and from the remote server
- {% url `cy.clearCookies()` clearcookies %} will clear all of the browser cookies
- {% url `.click()` click %} will cause your application to react to click events

None of the above commands are **idempotent**, they all cause side effects. It makes no sense to race commands because commands must be run in a controlled, serial manner in order to create consistency. Because integration and e2e tests primarily represent the actions of a real user, Cypress models its command execution model after a real user working step by step.

***You cannot accidentally forget to return or chain a command***

In real promises it's very easy to 'lose' a nested Promise if you don't return it and chain it correctly.

Let's imagine the following `node.js` code

```js
// assuming we've promisified our fs module
return fs.readFile('/foo.txt', 'utf8')
.then((txt) => {
  // oops we forgot to chain / return this Promise
  // so it essentially becomes 'untrackable and lost'.
  // this can create bizarre race conditions and
  // bugs that are incredibly difficult to track down
  fs.writeFile('/foo.txt', txt.replace("foo", "bar"))

  return fs.readFile("/bar.json")
  .then((json) => {
    ...
  })
})
```

The reason this is even possible to do in the Promise world is because you have the power to execute multiple asynchronous actions in parallel.

Under the hood, each promise 'chain' returns a promise instance which tracks the relationship between linked parent and child instances.

Because Cypress enforces commands to run *only* serially, this concern does not exist in Cypress. Instead we enqueue all commands onto a **global** singleton. Because there is only ever a single command queue instance, its impossible for commands to ever be *untracked or lost*.

You can simply think of Cypress as "queueing" every command you issue. Eventually they'll get run and in the exact order they were called, 100% of the time.

There is no need to ever `return` Cypress commands.

***You cannot add a `.catch` error handler to a failed command***

In Cypress there **is no error recovery from a failed command**. A command and its assertions all **eventually** pass, or if one fails, all remaining commands are not run, and the test fails.

We are regularly asked:

> How do I create control flow (if / else) where if an element does (or doesn't) exist, I do something different?

While that may seem like a reasonable question, it's actually completely non-deterministic and it's impossible for a script (or robot) to follow this logic 100% consistently.

In general, there are only a handful of very specific situations where you **can** create control flow.

Asking to recover from errors is actually just asking for another `if/else` control flow.

With that said, as long as you are aware of the potential pit falls with control flow, it is possible to do this in Cypress!

{% note info %}
We are working on a new guide to better explain what we mean. We'll provide specific examples where you **can** create deterministic control flow without slowing down your tests or recovering from errors. Sit tight, details to come!
{% endnote %}

# Assertions

Assertions are how you ensure the state of your application is what you expect it to be. In english, this might be phrased as:

> After clicking on this `<button>`, I expect it's class to eventually be `active`.

```js
cy.get('button').click().should('have.class', 'active')
```

...or...

> After making an HTTP request to my server, I expect the response body to equal `{ name: 'Bob' }`

...and in code...

```js
cy.request("/users/1").its('body').should('deep.eq', { name: 'Bob' })
```

The idea is to throw an error if the condition is ever _not_ true.

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

- The initial visit url could respond with something other than success
- Any of the {% url `cy.get()` get %} commands could fail to find their elements
- Form submission could result in a non-success HTTP code
- The in-page JS (the application under test) could throw an error

Can you think of any more?

{% note success Core Concept %}
With Cypress, you don't have to assert to have a useful test. Even without assertions, a few lines of Cypress can ensure thousands of lines of code are working properly across the client and server!

{% endnote %}

Cypress anticipates the chaos of modern web development and {% url 'visualizes it in a reasonable way' overview-of-the-gui %}. Failures are important! Cypress makes them obvious and easy to understand.

As such, it may help to relax your test-obsessed mind and take a leisurely drive through your application: visit some pages, click some links, type into some fields, submit a form, and call it a day. You can rest assured that _so many things must be working_ in order for you to be able to navigate from Page A to Page Z without error. If anything is fishy, Cypress will tell you about it... with laser focus!

## List of Assertions

Cypress wraps `Chai`, `Chai-jQuery`, and `Sinon-Chai` to provide the built-in assertions. You can learn more in {% url 'the list of assertions reference' assertions %}. You can also write your own assertions as Chai plugins and use them in Cypress.

## Writing Assertions

There are two ways to write assertions in Cypress:

1. **Implicit Subjects:** Using {% url `.should()` should %} or {% url `.and()` and %}
2. **Explicit Subjects:** Using `expect`.

{% note info Assertion Libraries %}
Cypress bundles {% url 'popular assertion libraries' assertions %} for you, and exposes synchronous and asynchronous assertion interfaces. In Cypress, you're always a few keystrokes away from an expressive test.

{% endnote %}

## Implicit Subjects

Using {% url `.should()` should %} or {% url `.and()` and %} commands is the preferred way of making assertions in Cypress. These are typical Cypress commands, which means they apply to the current subject in the command chain.

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

Because `.should('have.class', ...)` does not change the subject, the `.and('have.attr', ...)` is executed against the same element. This is handy when you need to assert multiple things against a single subject quickly, but there are pitfalls...

{% note danger Beware: Assertions That Change The Subject %}
Some assertions modify the current subject unexpectedly. For example, the line `cy.get('a').should('have.attr', 'href', '/users')` modifies the subject from the `<a>` element to the string `"/users"`. This is because Cypress honors the return value of the assertion, and `have.attr` is a `Chai-jQuery` assertion that returns the matched string instead of the original subject. This can be surprising!

**Note:** This behavior is actually going away in the next release: `0.20.0`. We'll update these docs once that change is in.

Whenever you have failing assertions and don't understand why, click the line in the Cypress Command Log on the left side of the GUI. Cypress will print details to the browser console to help you troubleshoot what is going on.

{% endnote %}

If we wrote this assertion in the explicit form "the long way", it would look like this:

```js
cy.get('tbody tr:first').should(function($tr) {
  expect($tr).to.have.class('active')
  expect($tr).to.have.attr('href', '/users')
})
```

The implicit form is much shorter! So when would you want to use the explicit form?

## Explicit Subjects

Using `expect` allows you to pass in a specific subject and make an assertion about it. This is probably how you're used to seeing assertions written as it is very common in unit tests:

```js
// the explicit subject here is the boolean: true
expect(true).to.be.true
```

{% note info Did you know you can write Unit Tests in Cypress? %}
Check out our example recipes for {% url 'unit testing' unit-testing %} and {% url 'unit testing React components' unit-testing %}
{% endnote %}

Explicit assertions are great when you want to:

- Perform custom logic prior to making the assertion
- Make multiple assertions against the same subject

The {% url `.should()` should %} command allows us to pass a function that will be yielded the subject. This works just like {% url `.then()` then %}, except Cypress will automatically wait for the everything inside of the callback function to pass.

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
      'Some text from first p',
      'More text from second p',
      'And even more text from third p'
    ])
})
```

{% note danger Make sure `.should()` is safe %}
When using a function passed to {% url `.should()` should %}, be sure that the entire function can be executed multiple times without issue. Cypress applies its retry logic to these functions: so long as there's a failure, it will repeatedly try again until the timeout is reached. That means your code should be retry-safe. The technical term for this means your code must be **idempotent**.

{% endnote %}

## Default Assertions

Many commands have a default, built-in assertion, or rather have requirements that may cause it to fail without an assertion you've written.

For instance:

- {% url `cy.visit()` visit %} expects the page to send `text/html` content with a `200` status code
- {% url `cy.request()` request %} expects the remote server to exist and provide a response
- {% url `cy.get()` get %} expects the element to eventually exist in the DOM
- {% url `.find()` find %} also expects the element to eventually exist in the DOM
- {% url `.type()` type %} expects the element to eventually be *typeable*
- {% url `.click()` click %} expects the element to eventually be in an *actionable* state

Certain commands may have a specific requirement that causes them to immediately fail: such as {% url `cy.request()` request %}. Others, such as DOM based commands will automatically retry and wait for the DOM to reach the desired state before failing.

{% note success Core Concept %}
In fact, all DOM based commands automatically wait for their elements to exist in the DOM.
{% endnote %}

These rules are pretty intuitive, and most commands give you flexibility to override or bypass the default ways they can fail, typically by passing the `{ force: true }` option.

Here's an example what Cypress is checking under the hood:

```js
cy
  // there is a default assertion that this
  // button must exist in the DOM before proceeding
  .get('button')

  // before issuing the click, this button must be "actionable"
  // it cannot be disabled, covered, or hidden from view.
  .click()
```

Cypress will automatically **wait** for elements to reach stable states before giving up and failing. Just like with regular assertions you've added, these default assertions all share the **same** timeout values.

***Reversing the Default Assertion for Elements***

Most of the time, when querying for elements you expect them to eventually exist. But sometimes you wish to wait until they **don't** exist.

All you have to do is simply add that assertion and Cypress will *reverse* its rules waiting for elements to exist.

```js
// now Cypress will wait until this
// <button.close> is removed from the
// DOM after the click
cy.get('button.close').click().should('not.exist')

// make sure this <#modal>
// does not exist in the DOM and
// automatically wait until it's gone!
cy.get('#modal').should('not.exist')
```

# Timeouts
All commands that **do** something can time out.

All assertions, whether they're the default ones, or whether they've been added by you **all share the same timeout values**.

Because assertions are used to describe the state of the proceeding command - that's where the timeout values go.

Example #1:

```js

```

# Actions

## Visibility Rules

## Actionable Rules
