excerpt: Walkthrough writing your first test
slug: writing-your-first-test

## Definitions

There are certain terms you should be familiar with to help you follow this guide before writing your first test.

### In your test file:

<dl>
  <dt><strong>Test File</strong></dt>
  <dd>A file that contains test suites.</dd>
  <dt><strong>Test Suite</strong></dt>
  <dd>A collection of tests that are related to each other in some way.</dd>
  <dt><strong>Test</strong></dt>
  <dd>A function that makes calls to application code and makes assertions about what it should have done</dd>
  <dt><strong>Assertion</strong></dt>
  <dd>An assertion is a function call or command that verifies an expected, correct, value (e.g. `expect(true).to.be.true` or `cy.get('input').should('have.class', 'active')`)</dd>
  <dt><strong>Command</strong></dt>
  <dd>An action issued to the Cypress driver</dd>
  <dt><strong>Parent Command</strong></dt>
  <dd>...</dd>
  <dt><strong>Subject Command</strong></dt>
  <dd>...</dd>
  <dt><strong>Dual Command</strong></dt>
  <dd>...</dd>
</dl>

These concepts can be visualized in this structure:

```javascript
app_spec.js --- Test File ---

// ------------ Test Suite --------------
describe("My ToDo App Starts", function(){

  context("When page is initially opened", function(){

    // ------------ Test -------------
    it("should focus on the todo input field [002]", function(){

      // ------------- Assertions ----------------
      cy
        // - Parent Command - //
        .get("input")

        // - Subject Command - //
        .should("have.class", "new-todo")

    })

  })

})
```

### In Cypress' Test Runner:

<dl>
  <dt><strong>Command Log</strong></dt>
  <dd>...</dd>
  <dt><strong>Instrument Panel</strong></dt>
  <dd>...</dd>
  <dt><strong>Application Frame</strong></dt>
  <dd>...</dd>
</dl>

## How to write tests

Cypress is built on top of [Mocha](http://on.cypress.io/guides/bundled-tools#mocha) and uses its `bdd` interface. Tests you write in Cypress will mostly adhere to this style.

If you're familiar with writing tests in JavaScript, then writing tests in Cypress will be a breeze.

We're still working on introductory docs and videos. For now, [check out some examples](http://on.cypress.io/guides/all-example-apps) of applications using Cypress tests.

## Command Line Tools

Cypress can also be run headlessly from the command line. You can use the [CLI tools](https://github.com/cypress-io/cypress-cli) to do things like:

- Run Headlessly
- Run in CI
- Install Cypress

The [documentation for this tool is here](https://github.com/cypress-io/cypress-cli).