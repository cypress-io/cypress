---
title: Writing Your First Test
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- Where test files go and how they look
- Basics of testing
- Basic web navigation, DOM selection, and assertions
{% endnote %}

# A Simple Test

Let's start with something simple. Open up your favorite IDE and create a new file at `./cypress/integration/simple_spec.js`. We'll fill it in with an outline to demonstrate how Cypress works:

```js
describe("My First Test", function() {
  it("Doesn't do much!", function() {
    expect(true).to.equal(true)
  })
})
```

Though it doesn't do anything useful, this is a valid test! If we open Cypress (via `npm test` if you created the shortcut in the previous guide) it will list our new spec file next to the generated `example_spec.js`:

{% img /img/guides/getting-started/writing-your-first-test/a-simple-test.png %}

Click on `simple_spec.js` and Cypress will execute the test suite defined in that file. Below, you can see how Cypress sees that test and visualizes it in the Command Log. Admittedly, the test doesn't do much, but hey, it's green!

{% img /img/guides/getting-started/writing-your-first-test/simple-spec.png %}

{% note info Where do `describe` and `it` come from? %}
Cypress uses the nested, functional style of organizing tests made popular by the {% url 'RSpec' http://rspec.info/ %}, {% url 'Jasmine' https://jasmine.github.io/ %}, and {% url 'Mocha' https://mochajs.org/ %} communities. In fact, Cypress {% url 'bundles and improves on Mocha' bundled-tools#Mocha %} to provide this support.
{% endnote %}

# Structure of a Test

A solid test generally happens in 3 phases:

1. Set up the world state.
2. Take an action.
3. Make an assertion about the resulting world state.

You might also see this phrased as "Given, When, Then", or other formulations of this idea. The idea is simple: first you set the system up exactly how you want it, then you inject some change agent into the system, and then you check that the final state of the system is what you expect it to be.

Today we'll take a narrow view of these steps and map them cleanly to some Cypress commands:

1. Visit a web page.
2. Select and interact with an element on the page.
3. Assert something about the content on the page.

## Step 1: Visit a Page with `cy.visit(url)`

First, let's visit a web page. We will use our {% url 'Kitchen Sink application' 'https://example.cypress.io/' %} in this example so that you can try Cypress out without needing to bring your own app today.

Using {% url "cy.visit" visit %} is easy, it's just `cy.visit("https://example.cypress.io/")`. Let's replace our previous test with a new one that actually visits a page:

```js
describe("My First Test", function() {
  it("Visits the Kitchen Sink", function() {
    cy.visit("https://example.cypress.io/")
  })
})
```

Save the file and switch back over to the Cypress browser (or start it back up again if you closed it.) You might notice a few things:

1. Cypress detected that the test file changed and automatically reloaded and re-ran it.
2. The Command Log now shows the new `VISIT` action.
3. The Kitchen Sink application has been loaded into the app preview pane.
4. The test is green, even though we made no assertions.

{% img /img/guides/getting-started/writing-your-first-test/visit-a-page.png %}

{% note danger Warning: Do Not Test Production Apps %}
Visiting non-development URLs (as we've done here) is an anti-pattern: don't do this for your real tests, you should ALWAYS be testing against a development build that you have full control over. Cypress is not a general web automation tool and is poorly suited to scripting live, production websites.
{% endnote %}

## Step 2: Find an Element and Click It

Now that we've got a page loading, we need to take some action on it. Why don't we click a link on the page? Sounds easy enough, let's go look for one we like... how about "type" under the "Actions" heading?

To find this element by its contents, we'll use {% url `cy.contains` contains %}, like this `cy.contains("type")`. Let's add it to our test and see what happens:

```js
describe("My First Test", function() {
  it("Visits the Kitchen Sink", function() {
    cy.visit("https://example.cypress.io/")

    cy.contains("type")
  })
})
```

...and the test is still green. We know that Cypress found something because it will fail if anything isn't in place the way we say it is. To verify this, replace "type" with something not on the page, like "hype", and rerun the test. It goes red! Cypress verifies everything for us as we go, and fails a test if anything is out of order.

Ok, now how do we click on the link we found? You could almost guess this one: just add a `.click()` to the end of the previous command, like so:

```js
describe("My First Test", function() {
  it("Visits the Kitchen Sink", function() {
    cy.visit("https://example.cypress.io/")

    cy.contains("type").click()
  })
})
```

You can almost read it like a little story! Cypress calls this "chaining", and we chain together commands to build up great-looking tests that really express what the app does in declarative language.

Also note that the app preview pane has updated further after the click, following the link and showing the destination page:

SCREENSHOT

## Step 3: Make an Assertion

Finally, let's assert that something is happening. Looking at this new page about the `.type()` command, we decide that we'd like to make sure some text is always present in the `<h1>` tag here. We can do that by looking up the tag and chaining an assertion to it with `.should()`.

Here's what that looks like:

```js
describe("My First Test", function() {
  it("Visits the Kitchen Sink", function() {
    cy.visit("https://example.cypress.io/")

    cy.contains("type").click()

    cy.get("h1").should('have.value', "Type Command")
  })
})
```

And there you have: a simple test in Cypress that visits a page, finds and clicks a link, then verifies the contents of the next page. If we read it out loud, it might sound like:

> Visit example.cypress.io, find and click on something labeled "type", then we should see an H1 tag with the text "Type Command".

Or in the Given, When, Then syntax:

1. Given a user visits example.cypress.io
2. When they click the link labeled "type"
3. Then they should see a heading of "Type Command"

Even your business analysts can appreciate this!

And hey, this is a very clean test! We didn't have to say anything about *how* things work, just that we'd like to verify a particular series of events.

## Bonus Step: Refactor

Once we have a passing test that covers the system we're working on, we usually like to go one step further and make sure the test code itself is well-structured and maintainable. This is sometimes expressed in TDD circles as "Red, Green, Refactor", which means:

1. Write a failing test.
2. Write the code to make the test pass.
3. Clean up the code, keeping the test passing.

Regardless of how you feel about writing tests first, the refactor step is very important! We want all of our code to be maintainable and extensible so that it lives a long and productive life, *including our test code*.

To make this concrete, imagine we added a second, similar test to this suite:

```js
describe("My First Test", function() {
  it("clicking type shows the heading Type Command", function() {
    cy.visit("https://example.cypress.io/")

    cy.contains("type").click()

    cy.get("h1").should('have.value', "Type Command")
  })

  it("clicking focus shows the heading Focus Command", function() {
    cy.visit("https://example.cypress.io/")

    cy.contains("focus").click()

    cy.get("h1").should('have.value', "Focus Command")
  })
})
```

We've got some duplication here and could probably make a number of refactoring moves, but for this brief tutorial we'll do a simple and common one. Let's move that initial visit out into a `beforeEach()` block.

```js
describe("My First Test", function() {
  beforeEach(function() {
    cy.visit("https://example.cypress.io/")    
  })

  it("clicking type shows the heading Type Command", function() {
    cy.contains("type").click()

    cy.get("h1").should('have.value', "Type Command")
  })

  it("clicking focus shows the heading Focus Command", function() {
    cy.contains("focus").click()

    cy.get("h1").should('have.value', "Focus Command")
  })
})
```

## Leverage `beforeEach` and `afterEach` Hooks

Implement a 2nd test
Use `.only` to focus on our new test
Utilize `.beforeEach` to do the `cy.visit()` -->
