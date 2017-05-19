title: Writing Your First Test
---

# What You'll Learn

- how test files are structured and executed
- basic web navigation, dom selection, and assertions

# Visual Learners

![First Test](http://placehold.it/1920x1080)

Now we're going to dig in and write our first test in Cypress.

_Aside: Is this your first test **ever**? It's OK if so! We're willing to teach if you're willing to learn._

## Organizing Tests with `describe`, `context`, and `it`

Cypress uses the nested, functional style of organizing tests made popular by the RSpec, Jasmine, and Mocha communities. (In fact, Cypress bundles and improves on Mocha to provide this support.) It looks like this:

```js
describe("The Pricing Page", function() {
  it("shows 3 prices", function() {
    // test code...
  })

  context("buttons", function() {
    it("have the label 'buy this'", function() {
      // test code...
    })
  })
})
```

Notice the clean, hierarchical flow of our tests when written in this way. You can nest as many `describe` and `context` blocks under the top-level `describe` as you wish (`describe` and `context` are aliases for each other, use whichever you prefer.) Tests will be defined inside the `it` blocks, and get run sequentially.

When we load up this file inside Cypress, we can see the hierarchy clearly:

![Test Hierarchy](http://placehold.it/1920x1080)

Cypress has also noticed that these tests are empty, and marked them "pending". Let's implement them now!

## Interacting with the Page

Implement `cy.visit(kitchen sink url)`, show in cypress
_Aside: Visiting non-development URLs is an anti-pattern: don't do this for real tests, you should ALWAYS be testing against a development build!_
Use `.only` to focus on our test
Implement `cy.get()` incorrectly, look at error in cypress
Fix `cy.get()`, add a `.click()`
Find something to assert on in the final state

## More Organization with `beforeEach` and `afterEach` Hooks

Implement a 2nd test
Utilize `.beforeEach` to do the `cy.visit()`
