---
title: Writing and Organizing Tests
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How to organize your test and support files.
- What languages are supported in your test files.
- How Cypress handles unit tests vs integration tests.
- How to group your tests.
{% endnote %}

# Folder Structure

After adding a new project, Cypress will automatically scaffold out a suggested folder structure. By default it will create:

```text
/cypress
  /fixtures
    - example.json

  /integration
    - example_spec.js

  /support
    - commands.js
    - defaults.js
    - index.js
```

***Configuring Folder Structure***

While Cypress allows to configure where your tests, fixtures, and support files are located, if you're starting your first project, we recommend you use the above structure.

You can modify the folder configuration in your `cypress.json`. See {% url 'configuration' configuration %} for more detail.

## Test Files

Test files may be written as:

- `.js`
- `.jsx`
- `.coffee`
- `.cjsx`

Cypress also supports `ES2015` out of the box. You can use either `ES2015 modules` or `CommonJS modules`. This means you can `import` or `require` both **npm packages** and **local relative modules**.

{% note info Example Recipe %}
Check out our recipe using {% url 'ES2015 and CommonJS modules' extending-cypress-recipe %}.
{% endnote %}

To see an example of every command used in Cypress, open the {% url "`example_spec.js`" https://github.com/cypress-io/cypress-example-kitchensink/blob/master/cypress/integration/example_spec.js %} within your `cypress/integration` folder.

To start writing tests for your app, simply create a new file like `app_spec.js` within your `cypress/integration` folder. Refresh your tests list in the Cypress GUI and your new file should have appeared in the list.

## Support Files

By default Cypress will automatically include the support file `cypress/support/index.js` **before** every single spec file it runs. We do this purely as a convenience mechanism so you don't have to import this file in every single one of your spec files.

The support file is a great place to put reusable behavior such as Custom Commands or global overrides that you want applied and available to all of your spec files.

From your support file you should also `import` or `require` other files to keep things organized.

We automatically seed you an example support file, which has several commented out examples.

{% note info Example Recipe %}
Our {% url 'Extending Cypress recipes' extending-cypress-recipe %} show you how to modify the support file.
{% endnote %}

## Fixture Files

Fixtures are used as external pieces of static data that can be used by your tests.

You would typically use them with the {% url `cy.fixture()` fixture %} command and most often when you're stubbing {% url 'Network Requests' network-requests %}.

# How to Write Tests

Cypress is built on top of {% url 'Mocha' bundled-tools#Mocha %} and uses its `bdd` interface. Tests you write in Cypress will mostly adhere to this style.

If you're familiar with writing tests in JavaScript, then writing tests in Cypress will be a breeze.

We're still working on introductory docs and videos. If you want to see Cypress in action, {% url 'check out some examples' kitchen-sink %} of applications using Cypress tests and {% url "check out some example recipes we've written" unit-testing-recipe %} for special use cases.

## BDD Interface

The BDD interface borrowed from {% url 'Mocha' bundled-tools#Mocha %} provides `describe()`, `context()`, `it()` and `specify()`.

`context()` is identical to `describe()` and `specify()` is identical to `it()`, so choose whatever terminology works best for you.

```javascript
// -- Start: Our Application Code --
function add (a, b) {
  return a + b
}

function subtract (a, b) {
  return a - b
}

function divide (a, b) {
  return a / b
}

function multiply (a, b) {
  return a * b
}
// -- End: Our Application Code --

// -- Start: Our Cypress Tests --
describe('Unit test our math functions', function() {
  context('math', function() {
    it('can add numbers', function() {
      expect(add(1, 2)).to.eq(3)
    })

    it('can subtract numbers', function() {
      expect(subtract(5, 12)).to.eq(-7)
    })

    specify('can divide numbers', function() {
      expect(divide(27, 9)).to.eq(3)
    })

    specify('can muliple numbers', function() {
      expect(multiply(5, 4)).to.eq(20)
    })
  })
})
// -- End: Our Cypress Tests --

```

## Hooks

Cypress also provides hooks (borrowed from {% url 'Mocha' bundled-tools#Mocha %}).

These are helpful to set conditions that you want run before a set of tests or before each test. They're also helpful to clean up conditions after a set of tests or after each test.

```javascript
describe('Hooks', function() {
  before(function() {
    // runs before all tests in this block
  })

  after(function() {
    // runs after all tests in this block
  })

  beforeEach(function() {
    // runs before each test in this block
  })

  afterEach(function() {
    // runs after each test in this block
  })
})
```

***The order of hook and test execution is as follows:***

- All `before()` hooks run (once)
- Any `beforeEach()` hooks run
- Tests run
- Any `afterEach()` hooks run
- All `after()` hooks run (once)

## Excluding and Including Tests

To run a specified suite or test simply append `.only()` to the function. All nested suites will also be executed.

```javascript
// -- Start: Our Application Code --
function fizzbuzz (num) {
  if (num % 3 === 0 && num % 5 === 0) {
    return "fizzbuzz"
  }

  if (num % 3 === 0) {
    return "fizz"
  }

  if (num % 5 === 0) {
    return "buzz"
  }
}
// -- End: Our Application Code --

// -- Start: Our Cypress Tests --
describe('Unit Test FizzBuzz', function(){
  function numsExpectedToEq (arr, expected) {
    // loop through the array of nums and make
    // sure they equal what is expected
    arr.forEach((num) => {
      expect(fizzbuzz(num)).to.eq(expected)
    })
  }

  it.only('returns "fizz" when number is multiple of 3', function(){
    numsExpectedToEq([9, 12, 18], "fizz")
  })

  it('returns "buzz" when number is multiple of 5', function(){
    numsExpectedToEq([10, 20, 25], "buzz")
  })

  it('returns "fizzbuzz" when number is multiple of both 3 and 5', function(){
    numsExpectedToEq([15, 30, 60], "fizzbuzz")
  })
})

```

To skip a specified suite or test simply append `.skip()` to the function. All nested suites will also be skipped.

```javascript
it.skip('returns "fizz" when number is multiple of 3', function(){
  numsExpectedToEq([9, 12, 18], "fizz")
})
```

## Dynamically Generate Tests

You can dynamically generate tests using JavaScript.

```javascript
describe('if your app uses jQuery', function(){
  ['mouseover', 'mouseout', 'mouseenter', 'mouseleave'].forEach((event) => {
    it('triggers event: ' + event, function(){
      // if your app uses jQuery, then we can trigger a jQuery
      // event that causes the event callback to fire
      cy
        .get('#with-jquery').invoke('trigger', event)
        .get('#messages').should('contain', 'the event ' + event + 'was fired')
    })
  })
})
```

The code above will produce a suite with 4 tests:

```text
> if your app uses jQuery
  > triggers event: 'mouseover'
  > triggers event: 'mouseout'
  > triggers event: 'mouseenter'
  > triggers event: 'mouseleave'
```
