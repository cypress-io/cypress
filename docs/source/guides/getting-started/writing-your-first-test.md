---
title: Writing Your First Test
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- Where test files go and how they look
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

Click on `simple_spec.js` and Cypress will execute the test suite defined in that file. It doesn't do much, but hey, it's green!

{% note info Where do `describe` and `it` come from? %}
Cypress uses the nested, functional style of organizing tests made popular by the {% url 'RSpec' http://rspec.info/ %}, {% url 'Jasmine' https://jasmine.github.io/ %}, and {% url 'Mocha' https://mochajs.org/ %} communities. In fact, Cypress {% url 'bundles and improves on Mocha' bundled-tools#Mocha %} to provide this support.
{% endnote %}

## Visit a Page

Implement `cy.visit(kitchen sink url)`, show in cypress

{% note danger Never Test Production %}
Visiting non-development URLs is an anti-pattern: don't do this for real tests, you should ALWAYS be testing against a development build!
{% endnote %}

## Find an Element and Click It

Implement `cy.get()` incorrectly, look at error in cypress
Fix `cy.get()`, add a `.click()`
Find something to assert on in the final state

## Leverage `beforeEach` and `afterEach` Hooks

Implement a 2nd test
Use `.only` to focus on our new test
Utilize `.beforeEach` to do the `cy.visit()` -->
