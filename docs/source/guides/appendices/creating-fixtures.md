title: Creating Fixtures
comments: true
---

# What are Fixtures

A fixture in Cypress is a fixed set of data located in a file that is used as a baseline for running tests. The purpose of a test fixture is to ensure that there is a well known and fixed environment in which tests are run so that results are repeatable. Fixtures are accessed within tests by using the [`cy.fixture`](https://on.cypress.io/api/fixture) command.

# Supported Formats

| File Extension |
| --- |
| `.coffee` |
| `.gif` |
| `.html` |
| `.jpeg` |
| `.jpg` |
| `.js` |
| `.json` |
| `.png` |
| `.txt` |
| `.csv` |
| `.tif` |
| `.tiff` |
| `.zip` |

## Validation

Cypress will automatically validate your fixtures. If your `.json`, `.js`, or `.coffee` files contain syntax errors, they will automatically be shown in the Command Log.

## Formatting

Cypress automatically formats your fixture files. That means you can paste in a single line of `json` and the next time Cypress serves this fixture, it will format / indent the `json` which makes it easier to read and debug.

Image fixtures will be sent as `base64`.

# Routing Responses

Cypress makes it easy to stub a network request and have it respond instantly with fixture data. This is covered in-depth [in the network guide](/guides/cypress-basics/dealing-with-the-network.html#Fixtures).

# Organizing Fixtures

Cypress will automatically scaffold out a suggested folder structure for organizing your fixtures on every new project. By default it will create this structure when you boot your project:

```text
// within your project's root folder
/cypress/fixtures/example.json
```

Your fixtures can be further organized within additional folders. For instance, you could create another folder called `images` and add images:

```text
/cypress/fixtures/images/cats.png
/cypress/fixtures/images/dogs.png
/cypress/fixtures/images/birds.png
```

To access the fixtures nested within the `images` folder, simply include the folder in your [`cy.fixture`](https://on.cypress.io/api/fixture) command.

```javascript
cy.fixture("images/dogs.png") //returns dogs.png as Base64
```
