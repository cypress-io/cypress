slug: using-aliases
excerpt: Reference work done in previous commands.

# Contents

- :fa-angle-right: [Async Challenges](#section-async-challenges)
- :fa-angle-right: [Introducing Aliasing](#section-introducing-aliasing)
- :fa-angle-right: [Aliasing DOM Elements](#section-aliasing-dom-elements)
- :fa-angle-right: [Aliasing Routes](#section-asliasing-routes)

***

# Async Challenges

Because all commands in Cypress are asynchronous, it makes referencing commands challenging. Aliasing is a DSL that solves referencing work done in previous commands.

**Imagine the following synchronous example in jQuery:**

```javascript
var body = $("body")

// do more work here

// later use this body reference
body.find("button")
```

> In Cypress, every command is asynchronous.

In jQuery we can assign regular values because work is performed synchronously. But in Cypress, every command is asynchronous, so there is no immediate return value. You'd have to do something like this to get access to previously resolved values:

```javascript
// A not good example of referencing in Cypress

var _this = this

cy.get("body").then(function($body){
  _this.body = $body
})

// more work here

cy.then(function(){
  cy.wrap(_this.body).find("button")
})
```

Of course this is *not good*. It's clunky and difficult to figure out what is going on. Plus, with complex JavaScript applications, the element references may no longer be in the DOM by the time you're ready to use them.

***

# Introducing Aliasing

**Aliasing** was designed to solve async referencing issues and DOM Element re-querying, routing requests and responses, server integration, and automated error handling. Aliasing also gives you a human readable word for a potentially complex series of events. Aliasing is prominently displayed in the Cypress Command Log making it even easier to understand relationships.

**Aliasing is incredibly powerful but very simple to use:**

* Create an alias with the [`cy.as`](https://on.cypress.io/api/as) command.
* Reference an alias with the [`cy.get`](https://on.cypress.io/api/get) or [`cy.wait`](https://on.cypress.io/api/wait) command.

Every time you reference an alias, it should be prefixed with `@`. You can think of this character as "a" for alias or you can think of an alias as a pointer (like how variables point to memory).

# Aliasing DOM Elements

One use case for aliasing is for referencing a DOM Element.

```javascript
// alias all of the tr's found in the table as 'rows'
cy.get("table").find("tr").as("rows")
```

Internally Cypress has made a reference to the `<tr>` collection returned as the alias "rows". To reference these same "rows" later, you can use the [`cy.get`](https://on.cypress.io/api/get) command.

```javascript
// Cypress returns the reference to the <tr>'s
// which allows us to continue to chain commands
// finding the 1st row.
cy.get("@rows").first().click()
```

Because we've used the `@` character in [`cy.get`](https://on.cypress.io/api/get), instead of querying the DOM for elements, [`cy.get`](https://on.cypress.io/api/get) looks for an existing alias called `rows` and returns the reference (if it finds it).

***

## When alias references no longer exist in the DOM

Cypress automatically decides when it should reference existing elements or re-query for new elements.

In many single-page JavaScript applications, the DOM re-renders parts of the application constantly. If you alias DOM elements that have been removed from the DOM by the time you call [`cy.get`](https://on.cypress.io/api/get) with the alias, Cypress automatically re-querys the DOM to find these elements again.

```html
<ul id="todos">
  <li>
    Walk the dog
    <button class="edit">edit</button>
  </li>
  <li>
    Feed the cat
    <button class="edit">edit</button>
  </li>
</ul>
```

Let's imagine when we click the `.edit` button that our `<li>` is re-rendered in the DOM. Instead of displaying the edit button, it instead displays an `<input />` text field allowing you to edit the todo. The previous `<li>` has been *completely* removed from the DOM, and a new `<li>` is rendered in its place.

**Cypress calculates stale alias references.**

```javascript
cy
  .get("#todos li").first().as("firstTodo")
  .get("@firstTodo").find(".edit").click()
  .get("@firstTodo").should("have.class", "editing")
    .find("input").type("Clean the kitchen")
```

When we reference `@firstTodo`, Cypress checks to see if all elements its referencing are still in the DOM. If they are, it returns those existing elements. If they aren't, Cypress replays the commands leading up to the alias definition.

In our case it would re-issue the commands: `cy.get("#todos li").first()`. Everything just works because the new `<li>` is found.

[block:callout]
{
  "type": "warning",
  "body": "*Usually* replaying previous commands will return what you expect, but not always. Cypress' calculations are complicated and we may improve this algorithm at a later time. It is recommended to not alias DOM elements very far down a chain of commands - **alias elements as soon as possible with as few commands as possible**. When in doubt, you can *always* issue a regular `cy.get` to query for the elements again."
}
[/block]

***

# Aliasing Routes

Another use case for aliasing is with routes. Using aliases with [`cy.route`](https://on.cypress.io/api/route) makes dealing with AJAX requests much easier.

![alias-routes](https://cloud.githubusercontent.com/assets/1271364/12363262/cf6fee26-bb95-11e5-8592-4f8cd3a6520e.jpg)

```javascript
cy
  .server()
  // alias this route as 'postUser'
  .route("POST", /users/, {id: 123}).as("postUser")
```

Once you've given a route an alias, you can use it later to indicate what you expect to have happen in your application. Imagine your application's code is as follows:

```javascript
$("form").submit(function(){
  var data = $(this).serializeData()

  // simple example of an async
  // request that only goes out
  // after an indeterminate period of time
  setTimeout(function(){
    $.post("/users", {data: data})
  }, 1000)
})
```

You can tell Cypress to wait until it sees a request that matches your aliased route using the [`cy.wait`](https://on.cypress.io/api/wait) command.

```javascript
cy
  .get("form").submit()
  .wait("@postUser")
  .get(".success").contains("User successfully created!")
```

**Telling Cypress to wait for an AJAX request that matches an aliased route has enormous advantages.**

1. Waiting for an explicit route reference is less flaky. Instead of waiting for an arbitrary period of time, waiting for a specific aliased route is much more predictable.
2. Cypress will resolve if there's already been a request that matches the alias.
3. The actual XHR request object will be yielded to you as the next subject.
4. Errors are more obvious.
