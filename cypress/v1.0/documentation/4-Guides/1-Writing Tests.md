slug: writing-tests

After adding your project, Cypress will automatically scaffold out a suggested folder structure. By default it will create:

```
/tests
/tests/_fixtures
/tests/_support
```
[block:callout]
{
  "type": "info",
  "body": "You can modify the folder configuration in your `cypress.json`. See [configuration](doc:configuration) for more detail.",
  "title": "Configure Folder Structure"
}
[/block]
## Test Files

Test files may be written as either `.js` or `.coffee` files.

To get started, simply create a new file: `tests/app_spec.js`

Cypress will now list this spec file inside of Cypress, and will run the tests within it.

## How to write tests

Cypress is built on top of [`Mocha`](tools#mocha) and uses its `bdd` interface. Therefore tests you write in Cypress will adhere to this style.

If you're familiar with writing tests in JavaScript, then writing tests in Cypress will be a breeze.

We are working on an introduction video, and many new example repos for you to look at.

Currently you can [check out the examples here](examples).