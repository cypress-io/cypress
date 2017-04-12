slug: fixture
excerpt: Load a fixture to represent data

[block:callout]
{
  "type": "info",
  "body": "[Read about Creating Fixtures first.](https://on.cypress.io/guides/creating-fixtures)",
  "title": "New to Cypress?"
}
[/block]

Loads a single fixture file. Image fixtures will be sent as `base64`.

If an extension is omitted, Cypress will attempt to resolve the fixture by order of these extensions:

* `.json`
* `.js`
* `.coffee`
* `.html`
* `.txt`
* `.csv`
* `.png`
* `.jpg`
* `.jpeg`
* `.gif`
* `.tif`
* `.tiff`
* `.zip`

| | |
|--- | --- |
| **Returns** | the contents of the file, formatted by file extension |
| **Timeout** | `cy.fixture` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) for the server to process this command. |

***

# [cy.fixture( *fixture* )](#section-single-fixture-usage)

Loads the fixture at the specified filepath within the [`fixturesFolder`](https://on.cypress.io/guides/configuration#section-folders), which defaults to `cypress/fixtures`.

***

# [cy.fixture( *fixture*, *encoding* )](#section-encoding)

Loads the fixture at the specified filepath within the [`fixturesFolder`](https://on.cypress.io/guides/configuration#section-folders), which defaults to `cypress/fixtures`, using the encoding specified when reading the file.

***

# Options

Pass in an options object to change the default behavior of `cy.fixture`.

**[cy.fixture( *fixture*, *options* )](#options-usage)**

**[cy.fixture( *fixture*, *encoding*, *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to wait for the `cy.fixture` command to be processed

***

# Single Fixture Usage

## Load the `users.json` fixture

```javascript
cy.fixture("users.json")
```

***

## Omit the fixture file's extension

```javascript
cy.fixture("admin")
```

When no extension is passed to `cy.fixture`, Cypress will search for files with the specified name within the [`fixturesFolder`](https://on.cypress.io/guides/configuration#section-folders), which defaults to `cypress/fixtures`, and resolve the first one. The above example would resolve in the following order:

1. `{fixturesFolder}/admin.json`
2. `{fixturesFolder}/admin.js`
3. `{fixturesFolder}/admin.coffee`
4. `{fixturesFolder}/admin.html`
5. `{fixturesFolder}/admin.txt`
6. `{fixturesFolder}/admin.csv`
7. `{fixturesFolder}/admin.png`
8. `{fixturesFolder}/admin.jpg`
9. `{fixturesFolder}/admin.jpeg`
10. `{fixturesFolder}/admin.gif`
11. `{fixturesFolder}/admin.tif`
12. `{fixturesFolder}/admin.tiff`
13. `{fixturesFolder}/admin.zip`

***

## Image fixtures will be sent by default as `base64`

```javascript
cy.fixture("images/logo.png").then(function(logo){
  // logo will be encoded as base64
  // and should look something like this:
  // aIJKnwxydrB10NVWqhlmmC+ZiWs7otHotSAAAOw==...
})
```

***

## Change encoding of Image fixture

```javascript
cy.fixture("images/logo.png", "binary").then(function(logo){
  // logo will be encoded as binary
  // and should look something like this:
  // 000000000000000000000000000000000000000000...
})
```

***

# Notes

## Nesting

You can nest fixtures within folders and reference them by defining the path to the file:

`{fixturesFolder}/users/admin.json`

```javascript
cy.fixture("users/admin.json")
```

***

## Validation

Cypress will automatically validate your fixtures. If your `.json`, `.js`, or `.coffee` files contain syntax errors, they will automatically be shown in the Command Log.

***

## Formatting

Cypress automatically formats your fixture files. That means you can paste in a single line of `json` and the next time Cypress serves this fixture, it will format / indent the `json`, which makes it easier to read and debug.

***

## Encoding

Cypress automatically determines the encoding for the following file types:

* `.json`
* `.js`
* `.coffee`
* `.html`
* `.txt`
* `.csv`
* `.png`
* `.jpg`
* `.jpeg`
* `.gif`
* `.tif`
* `.tiff`
* `.zip`

For other types of files, they will be read as `utf8` by default. You can specify a different encoding by passing it as the [second argument](https://on.cypress.io/api/fixture#section--cy-fixture-fixture-encoding-section-encoding-).

```javascript
cy.fixture("foo.bmp", "base64")
```

The following encodings are supported:

* `ascii`
* `base64`
* `binary`
* `hex`
* `latin1`
* `utf8`
* `utf-8`
* `ucs2`
* `ucs-2`
* `utf16le`
* `utf-16le`

***

# Usage with `cy.route()`

## Using fixture or fx shortcuts

Fixtures can be referenced directly by the special keywords: `fixture:` or `fx:`.

This enables you to set a fixture as the response for a route without having to first use the `cy.fixture` command.

```javascript
cy.route("GET", /users/, "fixture:users") // this works
cy.route("GET", /users/, "fx:users")      // this also works
```

This saves you from having to explicitly load the fixture first (like [below](https://on.cypress.io/api/fixture#section-using-cy-then-to-access-fixture-data)).

## Using cy.then to access fixture data

```javascript
cy
  .fixture("users").then(function(json){
    cy.route("GET", /users/, json)
  })
```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe using cy.fixture to bootstrap data for our application.](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)",
  "title": "Using cy.fixture for response data"
}
[/block]

## Using an alias to access a fixture

However if you still need access to the fixture data, instead of [yielding the fixture's data](https://on.cypress.io/api/fixture#section-using-cy-then-to-access-fixture-data), we can make use of [aliasing](https://on.cypress.io/guides/using-aliases).

Using an alias provides the benefit of terseness and readability.

```javascript
cy
  .fixture("users").as("usersJSON")
  .route("GET", /users/, "@usersJSON")

  // ...later on...

  .then(function(){
    // we have access to this.usersJSON since it was aliased
    this.usersJSON
  })
```

## Modifying fixture data before using it

You can also modify fixture data directly before passing it along to the route.

```javascript
cy
  .fixture("user").then(function(user){
    user.firstName = "Jane"

    cy.route("GET", "/users/1", user)
  })
  .visit("/users")
  .get(".user").should("include", "Jane")
})
```

***

# Command Log

## `fixture` does *not* log in the command log

***

# Related

- [Guide: Creating Fixtures](https://on.cypress.io/guides/creating-fixtures)
- [Recipe: Bootstrapping App Test Data](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)
- [route](https://on.cypress.io/api/route)
- [then](https://on.cypress.io/api/then)
