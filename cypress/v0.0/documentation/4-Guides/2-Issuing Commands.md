excerpt: Traverse the dom and perform actions with commands
slug: issuing-commands

## Async

When writing functional (integration) tests, you will inevitably traverse the DOM, and perform user actions. In traditional server-side rendered views, it's unlikely you'll be dealing with many application state changes. However, if you're writing an application using a modern JavaScript framework, you'll likely need to navigate through highly complex, dynamic situations.

Luckily, Cypress is designed to handle both of these situations perfectly well.

The architecture of Cypress focuses around asynchronicity. The DOM is a highly complex, mutable object, and to handle the indeterminate state of the DOM, we've designed our commands to be async.

Because all commands are async, this gives us many advantages. All commands can retry until a certain specified condition is met. Commands can be replayed, inserted between others, or even conditionally run. Cypress can also look ahead (or look behind) at commands which have yet to run, and alter its current behavior.

Cypress is designed around async disadvantages. One example is a concept known as [aliasing](http://on.cypress.io/guides/using-aliases). This works around the need to assign values to variables.

The Command API attempts to balance readability, terseness, flexibility, and capability all while being designed similar to API's you're already familiar with.

The Command API is fluent - that is, you chain all commands together - similar to how jQuery's API is designed.

## Subjects

Commands work just like JavaScript `Promises`. That is, the resolved value of one command becomes the `subject` of the next command - just like a waterfall.

```javascript
cy
  // when 'get' resolves the subject
  // becomes the DOM element <div#main>
  .get("#main")

  // once 'get' resolves, the find command
  // runs, and is passed <div#main> as its subject.
  // this becomes the subject that we 'find' into.
  .find("button")

  // once 'find' resolves the <button>
  // becomes the new subject which is
  // what the click operates on.
  // this is functionally equivalent to
  // writing $("#main").find("button").click() in jQuery.
  .click()
```

The difference between the Cypress API and jQuery's API is that all commands are async. No command returns an actual assignable value. That is because every command is queued, ran, and retried until it resolves. Some commands may not resolve until several seconds after they are run.

For instance you **cannot** do this:

```javascript
// THIS WILL NOT WORK!
button = cy.get("#main").find("button")
```

Just like `Promises`, the value that async commands return can only be yielded in a callback function.

If you want to retrieve the resolved value (the subject) of a command, simply use a `then` command, the same way you would with `Promises`.

```javascript
cy.get("#main").find("button").then(function($button){
  // when the 'find' command resolves, we can yield its
  // resolved value (the new subject) in a callback function.
  // now we can work with this value directly.
})
```

When chaining together multiple commands you rarely have to yield the subject via a `then`. Cypress favors readability and terseness, and even [assertions](http://on.cypress.io/guides/making-assertions) can be implicitly run without having to use a `then` command.

```javascript
// we're testing that an 'active' class is applied to our button
// after its been clicked by a user
cy.get("#main").find("button").click().should("have.class", "active")
```

## Chaining

Because Cypress implements a fluent API, all commands are linked together.  Cypress has a small, but powerful, set of rules to know how to process the chain of commands.

There are 3 types of commands:

- [Parent Commands](#parent-commands)
- [Child Commands](#child-commands)
- [Dual Commands](#dual-commands)

#### Parent Commands

Parent commands always **begin** a new chain of commands. Even if you've written a previous chain, parent commands will always start a new chain, and ignore existing chains.

These are the commands you'll write first off of the `cy` object.

Examples of parent commands:
 - [visit](http://on.cypress.io/api/visit)
 - [server](http://on.cypress.io/api/server)
 - [get](http://on.cypress.io/api/get)
 - [root](http://on.cypress.io/api/root)

```javascript
cy
  // visit is a parent command which is initially called off the cy object
  .visit("http://localhost:8000")

  // get ignores previously run commands and will query (by default)
  // from the root document
  .get("#main").find("button").click().should("have.class", "active")

  // because get is a parent command, when we use it a 2nd time in a chain
  // the previous chain is ignored and we query from the root document
  .get("input").type("foobarbaz")
```

#### Child Commands

Child commands are always chained off of a **parent** command, or another **child** command.

Examples of child commands:
- [find](http://on.cypress.io/api/find)
- [click](http://on.cypress.io/api/click)
- [type](http://on.cypress.io/api/type)
- [children](http://on.cypress.io/api/children)
- [should](http://on.cypress.io/api/should)

Each of the above commands require an existing subject, and more specifically an existing DOM subject. It wouldn't make sense to `click` into nothing, nor would it make sense to `type` or query for `children` of nothing.

**Note:**
> If child commands have specific rules which are not met, they will throw a very explicit error telling you why they can't be invoked at that time.

Looking at our previous example:

```javascript
cy
  .visit("http://localhost:8000")

  .get("#main")
    // we find the button within the existing DOM subject <div#main>
    // our subject now becomes the <button> element
    .find("button")

    // then we click the <button> subject
    .click()

    // the click command does not change the subject
    // it returns the existing <button> subject
    // we can now assert that this <button> has the class 'active'
    .should("have.class", "active")

  .get("input")

    // we type into an existing DOM <input /> subject
    .type("foobarbaz")
```

#### Dual Commands

While parent commands always start a new chain of commands and child commands require being chained to a parent command, `dual commands` can behave as both parent or child commands.

That is, they can **start** a new chain, or be chained off of an **existing** chain.

Examples of dual commands:
- [contains](http://on.cypress.io/api/contains)
- [wait](http://on.cypress.io/api/wait)

```javascript

cy
  // contains can act as a parent command, starting a chain of commands
  // as a parent command, contains will query from the root document by default
  .contains("Jane Lane").click()

  // or it can act as a child command, scoped to the 'get' parent command's subject
  // which only searches for content inside of the <form> element
  .get("form").contains("Submit!").click()

```

## Options

This is being rewritten per the latest API updates.

<!-- All commands which interact with the DOM support options. The key to testing even the most complex and sophisticated application state is understanding when to use these options.

Option | Default | Accepts
--- | --- | ---
[visible](#visible-options) | null | `true`, `false`, `null`
[exist](#exist--exists-options) | true | `true`, `false`
[exists](#exist--exists-options) | true | `true`, `false`
[length](#length-options) | null | `number`

`exist` and `exists` are aliases of one another. They only differ grammatically. Sometimes it reads better to pass `exists` when you know you are querying for multiple elements.  Other times, it reads better to pass `exist` when you're querying for only one specific element.

No matter how many dynamic arguments a command supports, you always pass it's options (optionally) as the last argument.

```javascript
// children accepts options as its 1st and only argument
cy.get("#dialog").children({exist: false})
```

```javascript
// find accepts a selector as it's 1st argument
// therefore options is passed as the 2nd argument
cy.get("#dialog").find("button", {exist: false})
```

```javascript
// contains dynamically accepts up to 3 arguments
// therefore options is the 3rd argument
cy.contains("li", "Jane Lane", {visible: false})
```

```javascript
// contains also supports 2 arguments
// therefore options is now the 2nd argument
cy.contains("Submit!", {visible: true})
```

```javascript
cy.get("ul").find("li", {length: 3})
```

**Note:**
> Many commands are modeled after jQuery methods. These commands always share the same querying rules, and number of arguments as their jQuery counterparts.

#### Visible Options

By default `visible` options are set to `null`. That means that Cypress is agnostic as to whether the element is visible or invisible.

By providing a value other than `null`, you are **explicitly** telling Cypress not to resolve this command until the matching element(s) meet the specified visibility state.

This is **not** the same thing as providing a *filter* for finding an element based on its visibility.

The `visible` options are much more powerful. They easily communicate how Cypress should proceed with the chain of commands.

**Note:**
> Cypress calculates an element's visibility [the same way jQuery does](https://api.jquery.com/visible-selector/).

Simple Example:

```javascript
// Application Code
$("button").click(function(e){

  // after our button is clicked
  // wait 500ms before showing the input
  // and adding the class 'active'
  setTimeout(function(){
    $("form input").show().addClass("active")
  }, 500)
})
```

In the example above we are binding to the `click` event of our button. Then after an indeterminate period of time, we are showing the `form input` and adding the class of active.

```javascript
// Test Code
cy
  // click the button
  .get("button").click()

  // explicitly force cypress to wait until this input is visible
  // once it is, assert it has the class 'active'
  .get("form input", {visible: true}).should("have.class", "active")
```

By providing the `visible: true` option, we are telling Cypress not to resolve the `get` **until** the matching element: `form input` is in a `visible` state. Cypress will continue to wait until this element reaches this state or eventually time out waiting.

These options are the building blocks for testing highly complex application behavior.

***

Complex Example:

```javascript
// Application Code
// when our form is submitted
$("form").submit(function(e){
  var $form = $(e.target)

  // serialize the form data
  var data = form.serializeData()

  // post it over AJAX to our backend
  $.post("/users", {data: data}).then(function(response){

    // when the AJAX completes successfully
    // fade out our form over 200 ms
    $form.fadeOut(200, function()){

      // then show the message with the response
      // from our server
      $("#message").show().text(response)
    }
  })
})
```

In this much more complex example, there are several asynchronous actions taking place in our application code.

1. The form data is sent over AJAX
2. The server responds after an indeterminate period of time
3. Our form fades out over an indeterminate period of time
4. Our success message is then shown after everything else completes

```javascript
// Test Code
cy
  // fill in the form inputs
  .get("form").fill({
    firstName: "Brian",
    lastName: "Mann",
    age: 29,
    gender: "male"
  })
  // submit the form
  .submit()

  // force cypress not to resolve this 'get' UNTIL the <form> element is no longer visible
  // this IS NOT saying to "query for the invisible form element"
  // this IS saying "once you find the form element, wait UNTIL it is invisible, before resolving"
  // the moment the <form> element becomes invisible, this command will resolve and proceed
  .get("form", {visible: false})

  // after the form resolves when it becomes invisible
  // wait UNTIL the <div#message> element becomes visible
  // the 'get' will retry until this element becomes visible
  // else it will time out waiting and provide an error message
  .get("#message", {visible: true})

    // once our <div#message> is visible we can query for its contents
    .contains("Successfully created user: Brian Mann")
```

With comments and line breaks removed:

```javascript
cy
  .get("form").fill({
    firstName: "Brian",
    lastName: "Mann",
    age: 29,
    gender: "male"
  }).submit()
  .get("form", {visible: false})
  .get("#message", {visible: true}).contains("Successfully created user: Brian Mann")
```

Our test is much less brittle and is completely decoupled from the implementation details of our application's code.

We could choose to remove the fadeOut, or increase its duration without having to touch our test. We simply describe the state our application **has** to be in for our commands to resolve.

If the application never reaches this state, the commands will time out, and will provide a precise error message.

#### Exist / Exists Options

By default, `exist` options are set to `true`. That means Cypress will not resolve any commands **until** at least 1 matched element exists in the DOM.

Consider this simple example:

```javascript
// Application Code
$("button").click(function(){

  // when our button is clicked, append a new DOM element
  // to the body after 500 ms
  setTimeout(function(){
    $("body").append($("<div id='message'>You clicked the button!</div>"))
  }, 500)
})
```

```javascript
// Test Code
cy
  // click the button
  .get("button").click()

  // query for the element <div#message>
  // this command is not resolved until
  // an element matches this query
  .get("#message")

  // ...more commands below...
```

Our `get("#message")` will not resolve until a matching element is found in the document.

This is very common in other testing tools as well. However, Cypress also adds the inverse of this option, which is `exist: false`.

The difference is that Cypress will then wait for the matching element **not** to exist before moving on.

Once again, all DOM based commands support this option.

Here is a more complex example:

```javascript
// Application Code
$("button").click(function(){

  // spawn a modal after the button is clicked
  var modal = $("#modal").modal({

    // when our modal is 'submitted'
    onSubmit: function(){
      // display a loading spinner
      var loading = $("#loading").show().text("Loading...")

      // post some arbitrary data to /users
      $.post("/users", {data: {...}).then(function(response){
        // when the response comes back

        // remove the loading message after 100ms
        loading.fadeOut(100)

        // close the modal, which animates fading out
        modal.close(function(){

          // and after its closed display the response
          // from the server
          $("#message").text(response)
        })
      })
    }
  })
})
```

To summarize this example:

1. We open a modal when our button is clicked
2. When the modal is submitted we display a loading indicator
3. We send an AJAX request to the server
4. When the AJAX comes back we fade out the loading indicator
5. We then close the modal which animates fading out
6. When the modal finishes closing we display the servers response

Here's how you could use `exist` and `visible` options to test this:

```javascript
// Test Code
cy
  .get("button").click()

  // create a new scope within <div#modal>
  .get("#modal").within(function(){
    cy
      // submit the modal
      .get("button[type=submit]").click()

      // ensure the loading indicator has the Loading... content
      .get("#loading").contains("Loading...")

      // wait for the loading indicator to no longer be visible
      // which happens when our response comes back from the server
      .get("#loading", {visible: false})

      // root refers to <div#modal>
      // we wait for it to no longer have children
      .root().children({exist: false})
  })

  // after all of the previous commands finish
  // ensure our <div#message> contains "Success!"
  .get("#message").contains("Success!")

```

With line breaks and comments removed:

```javascript
// Test Code
cy
  .get("button").click()
  .get("#modal").within(function(){
    cy
      .get("button[type=submit]").click()
      .get("#loading").contains("Loading...")
      .get("#loading", {visible: false})
      .root().children({exist: false})
  })
  .get("#message").contains("Success!")

```

#### Length Options
`length` specifies the number of elements that should be found before resolving.

This is incredibly useful when you are **adding** or **deleting** items which change the number of DOM elements found.

You will also find yourself using this option when dealing with **animations**.

```html
<ul>
  <li>
    <button class="delete">X</button>
  </li>
  <li>
    <button class="delete">X</button>
  </li>
  <li>
    <button class="delete">X</button>
  </li>
</ul>
```

```javascript
// Application Code
$(".delete").click(function(e){
  // get the parent li row
  var $row = $(e.target).parent("li")

  // fade out the row
  $row.fadeOut(500, function(){

    // then remove it
    $row.remove()
  })
})
```

```javascript
// Test Code
cy
  .get(".delete:first").click()

  // do not resolve until li's length is 2
  .get("ul").find("li", {length: 2})
``` -->

## DOM Events

TODO:

1. talk about simulated events vs native events
2. when each type of event is used
3. event strategy
4. known issues

## Page Events

Cypress will additionally log out when specific "page events" happen. These are events which alter the state of your application and can help provide insight and feedback into the logical order of what happened and when it happened.

For instance Cypress will log out the following:

* Whenever your URL changes (and the new url)
* Whenever the submit event is detected (from a traditional <form> submit)
* Whenever the page begins to load (after clicking on an <a> or navigating to another page)
* Whenever the page finishes loading
* Whenever an XHR is issued (when the `cy.server` has been started)

## Customizing

Cypress comes with its own API for creating custom commands. In fact, the same public methods *you* have access to are the same ones we used to create all of the built in commands. In other words, there's nothing special or different about ours or yours. You can customize every aspect of commands, not only their behavior, but also their display in the Command Log.

This allows you to build up specific commands for your application which take their own custom arguments, and perform their own custom behavior.

For example, the first custom command you'll probably create is the canonical `login` command. This typically would navigate the user to your `/login` url, fill out a username / password combination, submit the form, and then assert that the dashboard page comes up (or whatever happens upon successful login).

