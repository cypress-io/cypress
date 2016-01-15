slug: directory-structure
excerpt: Structure your folders and files

## Folder Structure

After adding your project, Cypress will automatically scaffold out a suggested folder structure. By default it will create:

```
/tests
/tests/_fixtures
/tests/_support
```

While Cypress allows for configuration of where your test files can be located, if you're starting your first project, we recommend you use the following structure.

[block:callout]
{
  "type": "info",
  "body": "You can modify the folder configuration in your `cypress.json`. See [configuration](http://on.cypress.io/guides/all-global-configuration) for more detail.",
  "title": "Configure Folder Structure"
}
[/block]

## Test Files

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