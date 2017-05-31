---
title: fixture
comments: true
description: ''
---

Load a fixed set of data located in a file.

{% note info New to Cypress? %}
[Read about Creating Fixtures first.](https://on.cypress.io/guides/creating-fixtures)
{% endnote %}

# Syntax

```javascript
.fixture(filePath)
.fixture(filePath, encoding)
.fixture(filePath, options)
.fixture(filePath, encoding, options)
```

## Usage

`.fixture()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.fixture('users').as('usersJson')  // load data from users.json
cy.fixture('logo.png').then(function(logo){
  // load data from logo.png
})  
```

## Arguments

**{% fa fa-angle-right %} filePath**  ***(String)***

A path to a file within the [`fixturesFolder`](https://on.cypress.io/guides/configuration#folders) (which defaults to `cypress/fixtures`).

You can nest fixtures within folders and reference them by defining the path from the fixturesFolder:

```javascript
cy.fixture('users/admin.json') // Get data from {fixturesFolder}/users/admin.json
```

**{% fa fa-angle-right %} encoding**  ***(String)***

The encoding to be used when reading the file. The following encodings are supported:

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

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.fixture()`.

Option | Default | Notes
--- | --- | ---
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for the command to be processed

## Yields

`.fixture()` yields the contents of the file. Formatting is determined by it's file extension.

## Timeout

`.fixture` will wait up for the duration of [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) for the server to process the command.

# Examples

## JSON

**Load a `users.json` fixture**

```javascript
cy.fixture('users.json').as('usersData')
```

**Omit the fixture file's extension**

When no extension is passed to `.fixture()`, Cypress will search for files with the specified name within the [`fixturesFolder`](https://on.cypress.io/guides/configuration#folders) (which defaults to `cypress/fixtures`) and resolve the first one.

```javascript
cy.fixture('admin').as('adminJSON')
```

The example above would resolve in the following order:

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

## Images

**Image fixtures are sent as `base64`**

```javascript
cy.fixture('images/logo.png').then(function(logo){
  // logo will be encoded as base64
  // and should look something like this:
  // aIJKnwxydrB10NVWqhlmmC+ZiWs7otHotSAAAOw==...
})
```

**Change encoding of Image fixture**

```javascript
cy.fixture('images/logo.png', 'binary').then(function(logo){
  // logo will be encoded as binary
  // and should look something like this:
  // 000000000000000000000000000000000000000000...
})
```

## Accessing Fixture Data

**Using cy.then to access fixture data**

```javascript
cy
  .fixture('users').then(function(json){
    cy.route('GET', '/users/**', json)
  })
```

{% note info %}
[Check out our example recipe using cy.fixture to bootstrap data for our application.](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)
{% endnote %}

**Using an alias to access a fixture**

You can make use of aliasing, [.as()](https://on.cypress.io/api/as), instead of working directly with the yielded data.

Using an alias provides the benefit of terseness and readability. It also makes it easier to access the data later in your tests.

```javascript
cy
  .fixture('users').as('usersJSON')
  .route('GET', '/users/**', '@usersJSON')

  // ...later on...

  .then(function(){
    // we have access to this.usersJSON since it was aliased
    this.usersJSON
  })
```

**Modifying fixture data before using it**

You can modify fixture data directly before passing it along to a route.

```javascript
cy.fixture('user').then(function(user) {
  user.firstName = 'Jane'
  cy.route('GET', '/users/1', user).as('getUser')
})

cy.visit('/users')
cy.wait('@getUser').then(function(xhr) {
  expect(xhr.requestBody.firstName).to.eq('Jane')
})
```

## Fixture Shortcuts

**Using `fixture` or `fx` shortcuts**

Fixtures can also be referenced directly without using the `.fixture()` command by using the special keywords: `fixture:` or `fx:` within [`.route()`](https://on.cypress.io/api/route).

```javascript
cy.route('GET', '/users/**', 'fixture:users') // this works
cy.route('GET', '/users/**', 'fx:users')      // this also works
```

# Notes

**Validation and Formatting**

Cypress automatically validates and formats your fixtures. If your `.json`, `.js`, or `.coffee` files contain syntax errors, they will be shown in the Command Log.

**Default Encoding**

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

For other types of files, they will be read as `utf8` by default, unless specified in the second argument of `.fixture()`

# Command Log

**`fixture` does *not* log in the command log**

# See also

- [Guide: Creating Fixtures](https://on.cypress.io/guides/creating-fixtures)
- [Recipe: Bootstrapping App Test Data](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)
- [readFile](https://on.cypress.io/api/readfile)
- [route](https://on.cypress.io/api/route)
- [then](https://on.cypress.io/api/then)
