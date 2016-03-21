slug: writing-your-first-test
excerpt: Walkthrough writing your first test

# Contents

- :fa-angle-right: [Folder Structure](#section-folder-structure)
- :fa-angle-right: [Test Files](#section-test-files)
- :fa-angle-right: [How to Write Tests](#section-how-to-write-tests)
- :fa-angle-right: [Command Line Tools](#section-command-line-tools)

***

# Folder Structure

After adding your project, Cypress will automatically scaffold out a suggested folder structure. By default it will create:

```text
/tests
/tests/_fixtures
/tests/_support
```

While Cypress allows for configuration of where your test files can be located, if you're starting your first project, we recommend you use the following structure.

[block:callout]
{
  "type": "info",
  "body": "You can modify the folder configuration in your `cypress.json`. See [configuration](https://on.cypress.io/guides/configuration) for more detail.",
  "title": "Configure Folder Structure"
}
[/block]

***

# Test Files

Test files may be written as either `.js` or `.coffee` files.

To get started, simply create a new file called `app_spec.js` within your `tests` folder.

Navigate to `http://localhost:2020`. You should see this spec file listed inside of Cypress.

[block:callout]
{
  "type": "warning",
  "body": "If you already had specs written within a `tests` folder, you may see those listed in Cypress as well. For now, just ignore these and we'll come back to them later.",
  "title": "I already had test files"
}
[/block]

***

# How to write tests

Cypress is built on top of [Mocha](https://on.cypress.io/guides/bundled-tools#section-mocha) and uses its `bdd` interface. Tests you write in Cypress will mostly adhere to this style.

If you're familiar with writing tests in JavaScript, then writing tests in Cypress will be a breeze.

We're still working on introductory docs and videos. For now, [check out some examples](https://on.cypress.io/guides/all-example-apps) of applications using Cypress tests.

***

# Command Line Tools

Cypress can also be run headlessly from the command line. You can use the [CLI tools](https://github.com/cypress-io/cypress-cli) to do things like:

- Run Headlessly
- Run in CI
- Install Cypress

The [documentation for this tool is here](https://github.com/cypress-io/cypress-cli).