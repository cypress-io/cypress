---
title: fixture
comments: false
---

Load a fixed set of data located in a file.

# Syntax

```javascript
cy.fixture(filePath)
cy.fixture(filePath, encoding)
cy.fixture(filePath, options)
cy.fixture(filePath, encoding, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.fixture('users').as('usersJson')  // load data from users.json
cy.fixture('logo.png').then((logo) => {
  // load data from logo.png
})  
```

## Arguments

**{% fa fa-angle-right %} filePath**  ***(String)***

A path to a file within the {% url `fixturesFolder` configuration#Folders %} , which defaults to `cypress/fixtures`.

You can nest fixtures within folders and reference them by defining the path from the fixturesFolder:

```javascript
cy.fixture('users/admin.json') // Get data from {fixturesFolder}/users/admin.json
```

**{% fa fa-angle-right %} encoding**  ***(String)***

The encoding to be used when reading the file. The following encodings are supported:

- `ascii`
- `base64`
- `binary`
- `hex`
- `latin1`
- `utf8`
- `utf-8`
- `ucs2`
- `ucs-2`
- `utf16le`
- `utf-16le`

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `cy.fixture()`.

Option | Default | Description
--- | --- | ---
`timeout` | {% url `responseTimeout` configuration#Timeouts %} | {% usage_options timeout cy.fixture %}

## Yields {% helper_icon yields %}

`cy.fixture()` yields the contents of the file. Formatting is determined by it's file extension.

# Examples

## JSON

***Load a `users.json` fixture***

```javascript
cy.fixture('users.json').as('usersData')
```

***Omit the fixture file's extension***

When no extension is passed to `cy.fixture()`, Cypress will search for files with the specified name within the {% url `fixturesFolder` configuration#Folders %} (which defaults to `cypress/fixtures`) and resolve the first one.

```javascript
cy.fixture('admin').as('adminJSON')
```

The example above would resolve in the following order:

1. `cypress/fixtures/admin.json`
2. `cypress/fixtures/admin.js`
3. `cypress/fixtures/admin.coffee`
4. `cypress/fixtures/admin.html`
5. `cypress/fixtures/admin.txt`
6. `cypress/fixtures/admin.csv`
7. `cypress/fixtures/admin.png`
8. `cypress/fixtures/admin.jpg`
9. `cypress/fixtures/admin.jpeg`
10. `cypress/fixtures/admin.gif`
11. `cypress/fixtures/admin.tif`
12. `cypress/fixtures/admin.tiff`
13. `cypress/fixtures/admin.zip`

## Images

***Image fixtures are sent as `base64`***

```javascript
cy.fixture('images/logo.png').then((logo) => {
  // logo will be encoded as base64
  // and should look something like this:
  // aIJKnwxydrB10NVWqhlmmC+ZiWs7otHotSAAAOw==...
})
```

***Change encoding of Image fixture***

```javascript
cy.fixture('images/logo.png', 'binary').then((logo) => {
  // logo will be encoded as binary
  // and should look something like this:
  // 000000000000000000000000000000000000000000...
})
```

## Accessing Fixture Data

***Using .then() to access fixture data***

```javascript
cy
  .fixture('users').then((json) => {
    cy.route('GET', '/users/**', json)
  })
```

***Using fixtures to bootstrap data***

{% note info %}
{% url 'Check out our example recipe using `cy.fixture()` to bootstrap data for our application.' working-with-the-backend-recipe %}
{% endnote %}

***Using an alias to access a fixture***

You can make use of aliasing, {% url `.as()` as %}, instead of working directly with the yielded data.

Using an alias provides the benefit of terseness and readability. It also makes it easier to access the data later in your tests.

```javascript
cy.fixture('users').as('usersJSON')
cy.route('GET', '/users/**', '@usersJSON')

  // ...later on...

cy.get('#email').then(() => {
  // we have access to this.usersJSON since it was aliased
  this.usersJSON
})
```

***Modifying fixture data before using it***

You can modify fixture data directly before passing it along to a route.

```javascript
cy.fixture('user').then((user)  => {
  user.firstName = 'Jane'
  cy.route('GET', '/users/1', user).as('getUser')
})

cy.visit('/users')
cy.wait('@getUser').then((xhr)  => {
  expect(xhr.requestBody.firstName).to.eq('Jane')
})
```

# Notes

## Shortcuts

***Using `fixture` or `fx` shortcuts***

Fixtures can also be referenced directly without using the `.fixture()` command by using the special keywords: `fixture:` or `fx:` within {% url `cy.route()` route %}.

```javascript
cy.route('GET', '/users/**', 'fixture:users') // this works
cy.route('GET', '/users/**', 'fx:users')      // this also works
```

## Validation

***Validation and Formatting***

Cypress automatically validates and formats your fixtures. If your `.json`, `.js`, or `.coffee` files contain syntax errors, they will be shown in the Command Log.

## Encoding

***Default Encoding***

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

For other types of files, they will be read as `utf8` by default, unless specified in the second argument of `cy.fixture()`.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.fixture %}

## Assertions {% helper_icon assertions %}

{% assertions once cy.fixture %}

## Timeouts {% helper_icon timeout %}

{% timeouts automation cy.fixture %}

# Command Log

- `cy.fixture()` does *not* log in the command log

# See also

- {% url `cy.route()` route %}
- {% url `.then()` then %}
- {% url 'Recipe: Bootstrapping App Test Data' working-with-the-backend-recipe %}
