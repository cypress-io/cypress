slug: writing-tests
excerpt: Writing Tests

# Only running one test

All tests have a `.only` method that can be used to run only one test or test suite.

```javascript
// this is the only test that will run when running test suite
it.only("has 'Welcome' in title", function(){
  cy.title().should("include", "Welcome")
})
``

# Skipping a test

All tests have a `.skip` method that can be used to skip a test or test suite.

```javascript
// this test will not run when running test suite
it.skip("button highlights as active", function(){
  cy.get("button").should("have.class", "active")
})
``
