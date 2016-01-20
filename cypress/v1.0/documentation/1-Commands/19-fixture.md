slug: fixture
excerpt: Load a fixture to represent data

# [cy.fixture( *fixture* )](#single-fixture-usage)

Loads a single fixture by filename.

If an extension is omitted, Cypress will attempt to resolve the fixture by order of these extensions:

* `.json`
* `.js`
* `.coffee`
* `.html`
* `.txt`
* `.png`
* `.jpg`
* `.jpeg`
* `.gif`
* `.tif`
* `.tiff`
* `.zip`

***

# Single Fixture Usage

Load the `users.json` fixture

```javascript
cy.fixture("users.json")
```

***

Omit the extension

```javascript
cy.fixture("admin")
```

Cypress will search for files called `admin` and resolve the first one in this order:

1. `{your project root}/tests/_fixtures/admin.json`
2. `{your project root}/tests/_fixtures/admin.js`
3. `{your project root}/tests/_fixtures/admin.coffee`

***

Image fixtures will be sent as `base64`

```javascript
cy.fixture("images/logo.png").then(function(logo){
  // logo will be encoded as base64
  // and should look something like this:
  // aIJKnwxydrB10NVWqhlmmC+ZiWs7otHotSAAAOw==...
})
```

***

# Notes

## Nesting

You can nest fixtures within folders and reference them by defining the path to the file:

`{your project root}/tests/_fixtures/users/admin.json`

```javascript
cy.fixture("users/admin.json")
```

***

## Validation

Cypress will automatically validate your fixtures. If your `.json`, `.js`, or `.coffee`  files contain syntax errors, they will automatically be shown in the Command Log.

***

## Formatting

Cypress automatically formats your fixture files. That means you can paste in a single line of `json` and the next time Cypress serves this fixture, it will format / indent the `json` which makes it easier to read and debug.

***

# Usage with `cy.route()`

Fixtures can be referenced directly by the special keywords: `fixture:` or `fx:`.

This enables you to set a fixture as the response for a route without having to first use the `cy.fixture` command.

## Example 1:

```javascript
cy.route("GET", /users/, "fixture:users") // this works
cy.route("GET", /users/, "fx:users")      // this also works
```

This saves you from having to explicitly load the fixture first (like in Example #2).

## Example 2:

```javascript
cy
  .fixture("users").then(function(json){
    cy.route("GET", /users/, json)
  })
```

However if you still need access to the fixture data, instead of yielding the fixture's data in Example #2, we can make use of [aliasing](http://on.cypress.io/guides/using-aliases).

## Example 3:

```javascript
cy
  .fixture("users").as("usersJSON")
  .route("GET", /users/, "@usersJSON")

  ...later on...

  .then(function(){
    // we have access to this.usersJSON since it was aliased
    this.usersJSON
  })
```

Using an alias provides the benefit of terseness and readability, yet still allows you access to the aliased object later on for direct manipulation.

This is useful when asserting about values in the fixture object, or perhaps if you need to change its values prior to handing it off to a [`cy.route`](http://on.cypress.io/api/route).

***

# More about Fixtures

For a detailed explanation of when and why to use fixtures, [read more about fixtures here](http://on.cypress.io/guides/creating-fixtures).