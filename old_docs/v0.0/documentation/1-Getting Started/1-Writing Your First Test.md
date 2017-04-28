slug: writing-your-first-test
excerpt: Walkthrough writing your first test

# Contents

- :fa-angle-right: [Folder Structure](#section-folder-structure)
- :fa-angle-right: [Test Files](#section-test-files)
- :fa-angle-right: [How to Write Tests](#section-how-to-write-tests)
  - [BDD Interface](#section-bdd-interface)
  - [Hooks](#section-hooks)
  - [Excluding and Including Tests](#section-excluding-and-including-tests)
  - [Dynamically Generate Tests](#section-dynamically-generate-tests)

***

# Folder Structure

After adding a new project, Cypress will automatically scaffold out a suggested folder structure. By default it will create:

```text
/cypress
/cypress/fixtures
/cypress/integration
/cypress/support
```

Cypress also adds placeholder files to help get you started with examples in each folder.

**Example JSON fixture**
```text
/cypress/fixtures/example.json
```

**Example Integration Test**
```text
/cypress/integration/example_spec.js
```

**Example JavaScript Support Files**
```text
/cypress/support/commands.js
/cypress/support/defaults.js
/cypress/support/index.js
```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe using support files to import common utilities](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/es2015_commonjs_modules_spec.js)",
  "title": "Using Support files for common functionality"
}
[/block]

**Configuring Folder Structure**

While Cypress allows for configuration of where your tests, fixtures, and support files are located, if you're starting your first project, we recommend you use the above structure.

You can modify the folder configuration in your `cypress.json`. See [configuration](https://on.cypress.io/guides/configuration) for more detail.

***

# Test Files

Test files may be written as `.js`, `.jsx`, `.coffee`, or `cjsx` files.

Cypress supports ES2015, ES2016, ES2017, and JSX. ES2015 modules and CommonJS modules are also supported, so you can `import` or `require` both npm packages and local modules.

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe using ES2015 and CommonJS modules](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/es2015_commonjs_modules_spec.js)",
  "title": "Importing ES2015 or CommonJS modules"
}
[/block]

To see an example of every command used in Cypress, open the [`example_spec.js`](https://github.com/cypress-io/cypress-example-kitchensink/blob/master/cypress/integration/example_spec.js) within your `cypress/integration` folder.

To start writing tests for your app, simply create a new file like `app_spec.js` within your `cypress/integration` folder. Refresh your tests list in the Cypress GUI and your new file should have appeared in the list.

***

# How to Write Tests

Cypress is built on top of [Mocha](https://on.cypress.io/guides/bundled-tools#section-mocha) and uses its `bdd` interface. Tests you write in Cypress will mostly adhere to this style.

If you're familiar with writing tests in JavaScript, then writing tests in Cypress will be a breeze.

We're still working on introductory docs and videos. If you want to see Cypress in action, [check out some examples](https://on.cypress.io/guides/all-example-apps) of applications using Cypress tests and [check out some example recipes we've written](https://github.com/cypress-io/cypress-example-recipes) for special use cases.

## BDD Interface

The BDD interface borrowed from [Mocha](https://on.cypress.io/guides/bundled-tools#section-mocha) provides `describe()`, `context()`, `it()` and `specify()`.

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

Cypress also provides hooks (borrowed from [Mocha](https://on.cypress.io/guides/bundled-tools#section-mocha)).

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

**The order of hook and test execution is as follows:**

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
  beforeEach(function(){
    this.numsExpectedToEq = (arr, expected) =>
      arr.forEach((num) => {
        expect(fizzbuzz(num)).to.eq(expected)
      })
  })

  // Only this test and it's beforeEach code would run
  it.only('returns "fizz" when number is multiple of 3', function(){
    this.numsExpectedToEq([9, 12, 18], "fizz")
  })

  it('returns "buzz" when number is multiple of 5', function(){
    this.numsExpectedToEq([10, 20, 25], "buzz")
  })

  it('returns "fizzbuzz" when number is multiple of both 3 and 5', function(){
    this.numsExpectedToEq([15, 30, 60], "fizzbuzz")
  })
})

```

To skip a specified suite or test simply append `.skip()` to the function. All nested suites will also be skipped.

```javascript
it.skip('returns "fizz" when number is multiple of 3', function(){
  this.numsExpectedToEq([9, 12, 18], "fizz")
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

```bash
> if your app uses jQuery
  > triggers event: 'mouseover'
  > triggers event: 'mouseout'
  > triggers event: 'mouseenter'
  > triggers event: 'mouseleave'
```


