excerpt: Write your first test
slug: writing-tests

## Recommended file structure

While Cypress allows for configuration of where your test files can be located, if you're starting your first project, we recommend you use the following structure.

```
- test
```

After adding your project, Cypress will automatically scaffold out a suggested folder structure. By default it will create:

```
/tests
/tests/_fixtures
/tests/_support
```
[block:callout]
{
  "type": "info",
  "body": "You can modify the folder configuration in your `cypress.json`. See [configuration](http://on.cypress.io/guides/all-global-configuration) for more detail.",
  "title": "Configure Folder Structure"
}
[/block]

## Definitions

There are certain terms you should be familiar with to help you follow this guide before writing your first test.

#### In your test file:

<dl>
  <dt><strong>Test</strong></dt>
  <dd>...</dd>
  <dt><strong>Test Suite</strong></dt>
  <dd>...</dd>
  <dt><strong>Command</strong></dt>
  <dd>...</dd>
  <dt><strong>Parent Command</strong></dt>
  <dd>...</dd>
  <dt><strong>Subject Command</strong></dt>
  <dd>...</dd>
  <dt><strong>Assertion</strong></dt>
  <dd>...</dd>
  <dt><strong>Alias</strong></dt>
  <dd>...</dd>
  <dt><strong>Fixture</strong></dt>
  <dd>...</dd>
</dl>

#### In Cypress' Test Runner:

<dl>
  <dt><strong>Command Log</strong></dt>
  <dd>...</dd>
  <dt><strong>Instrument Panel</strong></dt>
  <dd>...</dd>
  <dt><strong>Application Frame</strong></dt>
  <dd>...</dd>
</dl>


## Test Files

Test files may be written as either `.js` or `.coffee` files.

To get started, simply create a new file: `tests/app_spec.js`

Cypress will now list this spec file inside of Cypress, and will run the tests within it.

## How to write tests

Cypress is built on top of [`Mocha`](http://on.cypress.io/guides/bundled-tools#mocha) and uses its `bdd` interface. Therefore tests you write in Cypress will adhere to this style.

If you're familiar with writing tests in JavaScript, then writing tests in Cypress will be a breeze.

We are working on an introduction video, and many new example repos for you to look at.

Currently you can [check out the examples here](http://on.cypress.io/guides/all-example-apps).