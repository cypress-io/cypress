excerpt: Reference work done in previous commands.
slug: using-aliases

Because all commands in Cypress are async, it makes referencing commands between each other at best clumsy and obfuscated, and at worst impossible.

Aliasing is a `DSL` which solves the ability to reference work done in previous commands.

Imagine the following synchronous example in jQuery:

```javascript
var body = $("body")

// do more work between here

// later use this body reference
body.find("button")
```

In jQuery we can assign regular values because work is performed synchronously.

In Cypress every command is async, so there is no immediate return value. You'd have to do something like this to get access to previously resolved values:

```javascript
var _this = this

cy.get("body").then(function($body){
  _this.body = $body
})

// more work here

cy.then(function(){
  cy.wrap(_this.body).find("button")
})
```

Of course this is not good. It's clunky and nearly impossible to figure out what's going on. With complex JavaScript applications it's almost worthless because element references may no longer be in the DOM by the time you're ready to use them.

Aliasing was designed in Cypress to not only solve async referencing issues, but to additionally solve `DOM Element` re-querying, `routing` requests and responses, `server` integration, and a high degree of automated error handling. Not to mention, aliasing gives you a human readable word for a potentially complex series of events. Aliasing is prominently displayed in the **Command Log** making it even easier to understand relationships.

Aliasing is incredibly powerful but very simple to use.

To create an alias you [use the `cy.as` command](http://on.cypress.io/api/as).

You can reference aliases in commands like [wait](http://on.cypress.io/api/wait) or [get](get).

Every time you reference an alias you use the character `@`, which you can think of as "a" for alias. Or you can think of an alias as a pointer (like how variables point to memory).

## DOM Elements

One use case for aliasing is for referencing a DOM Element.

> Assign a collection of `<tr>` as 'rows'

```javascript
// alias all of the tr's found in the table as 'rows'
cy.get("table").find("tr").as("rows")
```

Internally Cypress has made a reference to the collection of `<tr>`s returned as the alias 'rows'.

To reference these same 'rows' later in Cypress, you use the `cy.get` command.

```javascript
// Cypress returns the reference to those rows
// which allows us to continue to chain commands
// about the 1st row.
cy.get("@rows").first().find(".delete").click()
```

Because we've used the `@` character in our `cy.get` argumetn, instead of querying the DOM for elements, `cy.get` instead looks for any existing aliases called `rows` and returns the reference it finds.

***

> When alias references no longer exist in the DOM

Cypress automatically decides when it should hand back existing elements, or re-query for new ones.

In advanced JavaScript applications, you may be re-rendering parts of the DOM constantly. If you alias DOM elements that are removed by the time you run `cy.get`, Cypress will automatically re-query the DOM to find these elements again.

Here's an example:

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

Let's imagine when we click the `.edit` button that our `<li>` is re-rendered in the DOM. Instead of displaying the edit button, it instead displays an `<input />` text field allowing you to edit the todo. The previous `<li>` is completely removed, and a new `<li>` is inserted in its place.

Cypress is smart enough to figure out stale alias references.

```javascript
cy
  .get("#todos li").eq(0).as("firstTodo")
  .get("@firstTodo").find(".edit").click()
  .get("@firstTodo").should("have.class", "editing")
    .find("input").type("Clean the kitchen")
```

When we reference `@firstTodo`, Cypress checks to see if all elements its referencing are still in the DOM. If they are, it will return those existing elements. If they aren't, Cypress will actually **replay** the commands leading up to the alias definition.

In our case it would actually re-issue the commands: `cy.get("#todos li").eq(0)`. Everything "just works" because the new `<li>` is found again.

***

> BEWARE: thar be dragons with aliasing a complex series of commands!

**Usually** replaying previous commands will return you what you expect, but not always. This is actually very complicated to get right, and Cypress may improve this algorithm at a later time.

It is recommended to not alias DOM elements far down a chain of commands - alias them as soon as possible with as few commands preceding it as possible.

When in doubt, you can **always** issue a regular `cy.get` to query for the elements again.

## Routes

Using route aliases makes dealing with AJAX requests much easier.

```javascript
cy
  .server()

  // alias this route as 'postUser'
  .route("POST", /users/, {id: 123}).as("postUser")
```

Once you've given your route an alias, you can easily use it to indicate to Cypress what you expect to have happen in your application.

***

> Cue Cypress to wait until the request happens

Imagine your application's code is as follows:

```javascript
// Application Code
$("form").submit(function(){
  var data = $(this).serializeData()

  // simple example of an async
  // request which only goes out
  // after an indeterminate period of time
  setTimeout(function(){
    $.post("/users", {data: data})
  }, 1000)
})
```

You can indicate to Cypress to wait until it sees a request which matches your aliased route using the [wait](http://on.cypress.io/api/wait) command.

```javascript
cy
  .get("form").submit()
  .wait("@postUser")
```

Telling Cypress to **wait for an AJAX request that matches the route: `postUsers`** has enormous advantages.

##### 1. Waiting for an explicit route reference isn't flaky.

As opposed to waiting for an arbitrary period of time, waiting for a specific aliased route is much more stable.

##### 2. Cypress will resolve if there's already been a request that matches the alias.

##### 3. The actual XHR request object will be yielded to you as the next subject.

##### 4. Errors are more obvious.

## Objects

## Hooks

## Properties

