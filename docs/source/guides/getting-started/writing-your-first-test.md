---
title: Writing Your First Test
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How test files are structured and executed
- Basic web navigation, DOM selection, and assertions
{% endnote %}

<!-- # Visual Learners

Now we're going to dig in and write our first test in Cypress.

_Aside: Is this your first test **ever**? It's OK if so! We're willing to teach if you're willing to learn._ -->

# Organizing Tests with `describe`, `context`, and `it`

Cypress uses the nested, functional style of organizing tests made popular by the {% url 'RSpec' http://rspec.info/ %}, {% url 'Jasmine' https://jasmine.github.io/ %}, and {% url 'Mocha' https://mochajs.org/ %} communities. (In fact, Cypress {% url 'bundles and improves on Mocha' bundled-tools#Mocha %} to provide this support.) It looks like this:

```js
describe('The Pricing Page', function() {
  it('shows 3 prices', function() {
    // test code...
  })

  context('buttons', function() {
    it('has the label "buy this"', function() {
      // test code...
    })
  })
})
```

Notice the clean, hierarchical flow of our tests when written in this way. You can nest as many `describe` and `context` blocks under the top-level `describe` as you wish

> `describe` and `context` are aliases for each other, use whichever you prefer!

Tests will be defined inside `it` blocks, and get run sequentially.

<!-- When we load up this file inside Cypress, we can see the hierarchy clearly: -->

<!-- Cypress has also noticed that these tests are empty, and marked them "pending". Let's implement them now! -->

<!-- # Interacting with the Page

Implement `cy.visit(kitchen sink url)`, show in cypress
_Aside: Visiting non-development URLs is an anti-pattern: don't do this for real tests, you should ALWAYS be testing against a development build!_
Use `.only` to focus on our test
Implement `cy.get()` incorrectly, look at error in cypress
Fix `cy.get()`, add a `.click()`
Find something to assert on in the final state

# More Organization with `beforeEach` and `afterEach` Hooks

Implement a 2nd test
Utilize `.beforeEach` to do the `cy.visit()` -->
