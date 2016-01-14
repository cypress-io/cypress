excerpt: Load fixtures
slug: creating-fixtures

Cypress has first class support for managing fixtures in your test files.

## What are Fixtures

## Supported Formats

## Fixtures vs Factories

## Routing Responses

## Organizing

Cypress will automatically scaffold out a suggested folder structure for organizing your fixtures.

By default it will create this for when you boot your project:

```javascript
// within your project's root folder
/tests/_fixtures/example.json
```

Your fixtures can be further organized within additional folders.

For instance, you could create another folder `images` and add images:

```
/tests/_fixtures/images/cats.png
/tests/_fixtures/images/dogs.png
/tests/_fixtures/images/birds.png
```

To access the fixtures nested within the `images` folder, simply include the folder in your `cy.fixture` command.

```javascript
cy.fixture("images/dogs.png") //returns dogs.png as Base64
```