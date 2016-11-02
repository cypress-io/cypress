slug: errors
excerpt: Errors that require additional explanation are listed here.

# Contents

- :fa-angle-right: [Sorry, there's something wrong with this file](#section-sorry-there-s-something-wrong-with-this-file)
- :fa-angle-right: [Cypress cannot execute commands outside a running test](#section-cypress-cannot-execute-commands-outside-a-running-test)
- :fa-angle-right: [cy.method() failed because the element you are chaining off of has become detached or removed from the dom](#section-cy-method-failed-because-the-element-you-are-chaining-off-of-has-become-detached-or-removed-from-the-dom)
- :fa-angle-right: [cy.method() failed because the element cannot be interacted with](#section-cy-method-failed-because-the-element-cannot-be-interacted-with)
- :fa-angle-right: [cy.method() failed because the element is currently animating](#section-cy-method-failed-because-the-element-is-currently-animating)
- :fa-angle-right: [Running Cypress in CI requires a secret project key](#section-running-cypress-in-ci-requires-a-secret-project-key)
- :fa-angle-right: [The test has finished but Cypress still has commands in its queue](#section-the-test-has-finished-but-cypress-still-has-commands-in-its-queue)
- :fa-angle-right: [cy.visit() failed because you're attempting to visit a second unique domain](#section-cy-visit-failed-because-you-are-attempting-to-visit-a-second-unique-domain)
- :fa-angle-right: [Cypress detected a cross origin error happened on page load](#section-cypress-detected-a-cross-origin-error-happened-on-page-load)

***

# Sorry, there's something wrong with this file

![screen shot 2015-12-01 at 12 29 06 pm](https://cloud.githubusercontent.com/assets/1268976/11508539/553573ba-9827-11e5-956b-e849b95e806c.png)

This message means that Cypress was unable to read or find tests in the specified file.

You'll typically receive this message due to:

- JavaScript syntax errors that prevent Cypress from reading your tests
- Compilation errors from typos in `.coffee` files

Check the console in your Developer Tools for JavaScript errors or warnings. If Cypress failed to compile a `.coffee` file, you will see the network request has a `500` status code in the Network tab.

You'll also get this message if you have an empty test file, and have not yet written any tests.

***

# Cypress cannot execute commands outside a running test

![screen shot 2015-12-02 at 9 57 23 pm](https://cloud.githubusercontent.com/assets/1268976/11550645/b9b8bd42-993f-11e5-896e-f6a6ca43acb4.png)

This message means you tried to execute one or more Cypress commands outside of a currently running test. Cypress has to be able to associate commands to a specific test.

Typically this happens accidentally, like in the following situation.

```javascript
describe("Some Tests", function(){
  it("is true", function(){
    expect(true).to.be.true // yup, fine
  })

  it("is false", function(){
    expect(false).to.be.false // yup, also fine
  })

  context("some nested tests", function(){
    // oops you forgot to write an it(...) here!
    // these cypress commands below
    // are run outside of a test and cypress
    // throws an error
    cy
      .visit("http://localhost:8080")
      .get("h1").should("contain", "todos")
  })
})
```

Simply move those Cypress commands into an `it(...)` and everything will work correctly.

If you are purposefully writing commands outside of a test, there is probably a better way to accomplish whatever you're trying to do. Read through the [Example Repos](https://on.cypress.io/guides/all-example-apps), [open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A), or [come talk to someone in Gitter](https://gitter.im/cypress-io/cypress).

***

# cy.method() failed because the element you are chaining off of has become detached or removed from the dom

![screen shot 2015-12-02 at 9 55 29 pm](https://cloud.githubusercontent.com/assets/1268976/11550618/79d68542-993f-11e5-8b5f-9418dfa964c1.png)

This message means you are trying to interact with a "dead" DOM element - meaning it is either detached or completely removed from the DOM.

Cypress errors because it cannot operate or interact with "dead" elements - just like a real user could not do this either.

Understanding how this happens is very important - and it is often easy to prevent. Let's investigate.

```html
<!-- your app HTML -->
<body>
  <div id="parent">
    <button>delete</button>
  </div>
</body>
```

```javascript
// your app code
$("button").click(function(){
  // when the <button> is clicked
  // we remove the button from the DOM
  $(this).remove()
})
```

```javascript
// buggy test code
cy
   // as soon as this click event happens the <button>
   // becomes removed from the DOM
  .get("button").click()

  // When cypress begins processing the 'parent' command
  // it will immediately detect that the current subject
  // which is the <button> is detached from the DOM and
  // will throw the error
  .parent()
```

We can prevent Cypress from throwing this error by rewriting our test code:

```javascript
// fixed test code
cy
  .get("button").click()

  // simply query for the parent directly here
  // instead of chaining off the <button> subject
  .get("#parent")
```

The above example is an oversimplification. Let's look at a more complex example.

In modern JavaScript frameworks, DOM elements are regularly `re-rendered` - meaning that the old element is thrown away and a new one is put in its place. Because this happens so fast, it may *appear* as if nothing has visibly changed. But if you are in the middle of executing commands it's possible the element you're interacting with has become "dead". To deal with this situation you must:

- understand when your application re-renders
- re-query for newly added DOM elements
- **guard** Cypress from executing commands until a condition is met

When we say **guard** we mean writing commands in such a way that prevents Cypress from going on before a specific condition is met. This usually means:

- writing an assertion
- waiting on an XHR

***

# cy.method() failed because the element cannot be interacted with

You may see a variation of this message for 4 different reasons:

1. the element is not visible
2. the element is being covered by another element
3. the element's center is hidden from view
4. the element is disabled

Cypress runs several calculations to ensure an element can *actually* be interacted with like a real user would.

If you're seeing this error, the solution is often obvious. You may need to add  **command guards** due to a timing or animation issue.

There have been situations where Cypress does not correctly allow you to interact with an element which should be interactive. If that's the case, [open an issue](https://github.com/cypress-io/cypress/issues/new?body=**Description**%0A*Include%20a%20high%20level%20description%20of%20the%20error%20here%20including%20steps%20of%20how%20to%20recreate.%20Include%20any%20benefits%2C%20challenges%20or%20considerations.*%0A%0A**Code**%0A*Include%20the%20commands%20used*%0A%0A**Steps%20To%20Reproduce**%0A-%20%5B%20%5D%20Steps%0A-%20%5B%20%5D%20To%0A-%20%5B%20%5D%20Reproduce%2FFix%0A%0A**Additional%20Info**%0A*Include%20any%20images%2C%20notes%2C%20or%20whatever.*%0A) or force the action to happen.

If you'd like to override these built-in checks, provide the `{force: true}` option to the action itself. Refer to each command for their available options, additional use cases and argument usage.

```javascript
// we ignore the built in error checking
// and force the action to happen
// regardless of whether the button is
// visible, disabled, or covered by another element
cy.get("button").click({force: true}).
```

*Be careful with this option. It's possible to force your tests to pass but your feature may actually be failing.*

***

# cy.method() failed because the element is currently animating

![screen shot 2015-12-30 at 11 44 22 pm](https://cloud.githubusercontent.com/assets/1268976/12061262/4f9a252e-af4f-11e5-9139-9c8bdb08ae58.png)

By default Cypress detects if an element you're trying to interact with is animating. This check ensures that an element is not animating too quickly for a real user to interact with the element. This also prevents some edge cases where actions such as [`type`](https://on.cypress.io/api/type) or [`click`](https://on.cypress.io/api/click) happenening too fast during a transition.

Cypress will continuously attempt to interact with the element until it eventually times out.

If you'd like to force Cypress to interact with the element there are a few options:

- Pass `{force: true}` and disables **all** error checking
- Pass `{waitForAnimations: false}` to disable animation error checking only
- Pass `{animationDistanceThreshold: 20}` to decrease the sensitivity to detecting if an element is animating too quickly for a user to interact with. By increasing the threshold this enables your element to move farther on the page without causing Cypress to continuously retry.

```javascript
cy.get("#modal button").click({waitForAnimations: false})
```

You can globally disable animation error checking, or increase the threshold by modifying your [`cypress.json`](https://on.cypress.io/guides/configuration).

```json
// cypress.json
{
  "waitForAnimations": false,
  "animationDistanceThreshold": 50
}
```

***

# Running Cypress in CI requires a secret project key

You may receive this error when trying to run Cypress tests in Continuous Integration. This means that you did not pass a specific key to: `cypress ci` in your CI configuration file.

Since no key was passed, Cypress then checks for any environment variable with the name `CYPRESS_CI_KEY`, but still didn't find any.

You can get your project's secret key by running the terminal command: `cypress get:key`

Then [add the key to your config file or as an environment variable](https://on.cypress.io/guides/continuous-integration#section-acquire-a-cypress-secret-key).

***

# The test has finished but Cypress still has commands in its queue

![screen shot 2016-04-04 at 12 07 40 pm](https://cloud.githubusercontent.com/assets/1268976/14254496/fa15f8da-fa5d-11e5-91b8-cdc8387e4dc8.png)

Let's examine several different ways you may get this error message. In every situation, you'll need to change something in your code to prevent this error.

[block:callout]
{
  "type": "warning",
  "title": "Flaky tests below!",
  "body": "Several of these tests are dependent on race conditions. You may have to run these tests multiple times before they will actually fail. You can also try tweaking some of the delays."
}
[/block]

## Simple Example

```javascript
describe("simple example", function(){
  // this first test will actually pass and shows you that
  // Cypress attempts to prevent this problem in every test
  it("Cypress is smart and this does not fail", function(){
    // queue up some commands
    // without returning the cy object
    // which is ok!
    cy
      .get("body")
      .children()
      .should("not.contain", "foo")

    // even though we return the string here
    // Cypress automatically figures out that you've
    // queued commands above and does not end the test
    // until all commands have finished
    return "foobarbaz"
  })

  it("but you can forcibly end the test early which does fail", function(done){
    // this example will fail because you've forcibly terminated
    // the test early with mocha
    cy
      .get("body")
      .then(function(){
        // forcibly end the test
        // even though there are still
        // pending queued commands below
        done()
      })
      .children()
      .should("not.contain", "foo")
  })
})
```

## Complex Async Example

```javascript
describe("a complex example with async code", function(){
  it("you can cause commands to bleed into the next test", function(){
    // what's happening here is that because we have NOT told mocha this is an async test
    // this test will pass immediately and move onto the next test...
    //
    // ...then, when the setTimeout callback function runs
    // new commands will get queued on the wrong test
    //
    // Cypress will detect this and fail the next test
    setTimeout(function(){
      cy.get("body").children().should("not.contain", "foo")
    }, 10)

    // the correct way to write the above test code would be this:
    // it("does not cause commands to bleed into the next test", function(done){
    //   setTimeout(function(){
    //     cy.get("body").children().should("not.contain", "foo").then(function(){
    //       now all the commands are correctly processed on this test
    //       and do not bleed into the next test
    //       done()
    //     })
    //   }, 10)
    // })

  })

  it("this test will fail due to the previous poorly written test", function(){
    // we will get the error here that Cypress detected
    // it still had commands in its command queue
    //
    // Cypress will print the commands out which should
    // help us figure out that the previous test is
    // causing this error message
    cy.wait(10)
  })
})
```

## Complex Promise Example

```javascript
describe("another complex example using a forgotten 'return'", function(){
  it("forgets to return a promise", function(){
    // we forget to return the promise to our test
    // which means the test passes synchronously but
    // our promise resolves during the next test.
    //
    // this causes the commands to be queued on the
    // wrong test
    Cypress.Promise.delay(10).then(function(){
      cy.get("body").children().should("not.contain", "foo")
    })

    // the correct way to write the above test code would be this:
    // it("does not forget to return a promise", function(){
    //   return Cypress.Promise.delay(10).then(function(){
    //     return cy.get("body").children().should("not.contain", "foo")
    //   })
    // }
  })

  it("this test will fail due to the previous poorly written test", function(){
    // we will get the error here that Cypress detected
    // it still had commands in its command queue
    //
    // Cypress will print the commands out which should
    // help us figure out that the previous test is
    // causing this error message
    cy.wait(10)
  })
})
```

***

# cy.visit() failed because you are attempting to visit a second unique domain

TBD.

***

# Cypress detected a cross origin error happened on page load

[block:callout]
{
  "type": "info",
  "title": "This is a simple overview...",
  "body": "For a more thorough explanation of Cypress's Web Security model, [please read our dedicated guide to it](https://on.cypress.io/guides/web-security)."
}
[/block]

This error means that your application navigated to a superdomain that Cypress was not bound to.

Initially when you `cy.visit` Cypress changes the url to match what you are visiting. This enables Cypress to communicate with your appliation to control it, and bypasses all same-origin security policies built into the browsers.

When your application navigates to a superdomain outside of the current origin-policy Cypress is unable to communicate with it, and thus fails.

There are generally fairly simple workarounds for these common situations:

1. Don't click `<a>` links that navigate you outside of your apps. Likely this isn't worth testing anyway. You should ask yourself: *What's the point of clicking and going to another app?* Likely all you care about is that the `href` attribute matches what you expect. So simply make an assertion about that.

2. You are testing a page that uses `Single sign-on (SSO)`. In this case your webserver is likely redirecting you between superdomains, and thus you receive this error message. You can likely get around this redirect problem by using [`cy.request`](https://on.cypress.io/api/request) and manually handling the session yourself.

If you find yourself stuck and cannot work around these issues you can just set this in your `cypress.json` file:

```javascript
// cypress.json
{
  chromeWebSecurity: false
}
```

But before doing so you should really understand and [read about the reasoning here](https://on.cypress.io/guides/web-security).