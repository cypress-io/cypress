slug: issuing-commands
excerpt: Traverse the dom and perform actions with commands

# Contents

- :fa-angle-right: [Commands are Async](#section-commands-are-async)
- :fa-angle-right: [Subjects](#section-subjects)
- :fa-angle-right: [Chaining](#section-chaining)
  - [Parent Commands](#section-parent-commands)
  - [Child Commands](#section-child-commands)
  - [Dual Commands](#section-dual-commands)

***

# Commands are Async

When writing integration tests, you will need to traverse the DOM and perform user actions. In traditional server-side rendered views, it's unlikely you be deal with many application state changes. However, if you're writing an application using a modern JavaScript framework, you'll likely need to navigate through highly complex, dynamic states.

> Cypress is designed to handle *both* traditional server-side rendered views & modern JavaScript framework applications.

The architecture of Cypress focuses around asynchronicity. The DOM is a highly complex, mutable object; to handle the indeterminate state of the DOM, we've designed our commands to be asynchronous.

**Because all commands are async, this offers many advantages.**

1. All commands can retry until a certain specified condition is met.
2. Commands can be replayed, inserted between others, or even conditionally run.
3. Cypress can look ahead (or look behind) at commands which have yet to run, and alter its behavior.

Cypress is designed to also handle the disadvantages of async. One example is [aliasing](https://on.cypress.io/guides/using-aliases). This works around the need to assign values to variables.

The [Command API](https://on.cypress.io/api) attempts to balance readability, terseness, flexibility, and capability all while being designed similar to familiar APIs. The [Command API](https://on.cypress.io/api) is also fluent - that is, you chain all commands together - similar to how jQuery's API is designed.

***

# Subjects

Commands work just like JavaScript Promises. That is, the resolved value of one command becomes the `subject` of the next command - just like a waterfall.

```javascript
cy
  // when 'get' resolves, the subject
  // becomes the DOM element <div#main>
  .get("#main")

  // after 'get' resolves, the find command
  // runs and is passed <div#main> as its subject.
  // <div#main> becomes the subject that we 'find' on.
  .find("button")

  // after 'find' resolves, <button> becomes the new subject.
  // <button> is what the click operates on.
  // this is functionally equivalent to
  // writing $("#main").find("button").click() in jQuery.
  .click()
```

The difference between the Cypress API and jQuery's API is that *all* commands are async. **No command returns an actual assignable value.** That is because every command is queued, ran, and retried until it resolves. Some commands may not resolve until several seconds after they are run.

For instance you **cannot** do this:

```javascript
// THIS WILL NOT WORK!
button = cy.get("#main").find("button")
```

Just like Promises, the value that async commands return can only be yielded in a callback function.

If you want to retrieve the resolved value (the subject) of a command, use a [`then`](https://on.cypress.io/api/then) command, the same way you would with Promises.

```javascript
cy.get("#main").find("button").then(function($button){
  // when the 'find' command resolves, we can yield its
  // resolved value (the new subject) in a callback function.
  // now we can work with this value directly.
  $button.trigger("click")
})
```

When chaining together multiple commands you rarely should need to yield the subject via a [`cy.then`](https://on.cypress.io/api/then) command. Cypress favors readability and terseness, and even [assertions](https://on.cypress.io/guides/making-assertions) can be implicitly run without having to use a [`cy.then`](https://on.cypress.io/api/then) command.

```javascript
// we're testing that an 'active' class is
// applied to our button after being clicked
cy.get("#main").find("button").click().should("have.class", "active")
```

***

# Chaining

Because Cypress implements a fluent API, all commands are linked together.  Cypress has a small, but powerful, set of rules to know how to process the chain of commands.

**There are 3 types of commands:**

- [Parent Commands](#section-parent-commands)
- [Child Commands](#section-child-commands)
- [Dual Commands](#section-dual-commands)

***

## Parent Commands

Parent commands always *begin* a new chain of commands. Even if you've written a previous chain, parent commands will always start a new chain, and ignore previous chains. Parent commands should be written off the `cy` object:

**Examples of parent commands:**

 - [`visit`](https://on.cypress.io/api/visit)
 - [`server`](https://on.cypress.io/api/server)
 - [`get`](https://on.cypress.io/api/get)
 - [`root`](https://on.cypress.io/api/root)

```javascript
cy
  // visit is a parent command which is initially called off the cy object
  .visit("http://localhost:8000")

  // get ignores previously run commands and will
  //  query (by default) from the root document
  .get("#main").find("button").click().should("have.class", "active")

  // because get is a parent command, when we use it a 2nd time in a chain
  // the previous chain is ignored and we query from the root document
  .get("input").type("foobarbaz")
```

***

## Child Commands

Child commands are always chained off of a **parent** command, or another **child** command.

**Examples of child commands:**

- [`find`](https://on.cypress.io/api/find)
- [`click`](https://on.cypress.io/api/click)
- [`type`](https://on.cypress.io/api/type)
- [`children`](https://on.cypress.io/api/children)
- [`should`](https://on.cypress.io/api/should)

Each of the above commands require an existing subject. It wouldn't make sense to [`click`](https://on.cypress.io/api/click) onto nothing, nor would it make sense to [`type`](https://on.cypress.io/api/type) or query for [`children`](https://on.cypress.io/api/children) of nothing.


[block:callout]
{
  "type": "info",
  "body": "If child commands have specific rules which are not met, they will throw a very explicit error telling you why they can't be invoked at that time."
}
[/block]

Looking at our previous example:

```javascript
cy
  .visit("http://localhost:8000")

  .get("#main")
    // we find the button within the existing DOM subject <div#main>
    // our subject now becomes the <button> element
    .find("button")

    // then we click the current subject, <button>
    .click()

    // the click command does not change the subject
    // it returns the existing <button> subject
    // we can now assert that the <button> has the class 'active'
    .should("have.class", "active")

  .get("input")

    // we type into an existing DOM <input /> subject
    .type("foobarbaz")
```

***

## Dual Commands

While parent commands always start a new chain of commands and child commands require being chained off a parent command, dual commands can behave as parent or child command. That is, they can **start** a new chain, or be chained off of an **existing** chain.

**Examples of dual commands:**

- [`contains`](https://on.cypress.io/api/contains)
- [`wait`](https://on.cypress.io/api/wait)

```javascript
cy
  // contains acts as a parent command, starting a chain of commands
  // contains will query from the root document (the default subject)
  .contains("Jane Lane").click()

  // contains can also act as a child command, using it's parent command's subject, <form>
  // contains only searches for content inside of the <form> element
  .get("form").contains("Submit!").click()

```