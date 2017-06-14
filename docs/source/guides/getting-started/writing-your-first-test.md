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

## Step 3: Make an Assertion

## Bonus Step: Refactor

Once we have a passing test that covers the system we're working on, we usually like to go one step further and make sure the test code itself is well-structured and maintainable. This is sometimes expressed in TDD circles as "Red, Green, Refactor", which means:

1. Write a failing test.
2. Write the code to make the test pass.
3. Clean up the code, keeping the test passing.

Regardless of how you feel about writing tests first, the refactor step is very important! We want our code to be maintainable and extensible so that it lives a long and fruitful life, and *test code is code, too*. 

## Leverage `beforeEach` and `afterEach` Hooks

Implement a 2nd test
Use `.only` to focus on our new test
Utilize `.beforeEach` to do the `cy.visit()` -->
