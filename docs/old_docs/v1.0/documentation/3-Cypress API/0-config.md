slug: config
excerpt: get and set configuration options

`Cypress.config` allows you to `get` and `set` your configuration options.

This document covers the API for consuming your configuration options *in your tests*.

[block:callout]
{
  "type": "info",
  "body": "[Read about configuration first.](https://on.cypress.io/guides/configuration)",
  "title": "New to Cypress?"
}
[/block]

# [Cypress.config()](#section-no-arguments-usage)

Returns all of your configuration options as an object literal.

***

# [Cypress.config( *key* )](#section-key-usage)

Returns the value of a single configuration option by its key.

***

# [Cypress.config( *key*, *value* )](#section-key-value-usage)

Sets a configuration option for a specific key.

***

# [Cypress.config( *object* )](#section-object-usage)

Sets multiple configuration options.

***

# No Arguments Usage

## Get all configuration options.

```javascript
// cypress.json
{
  "defaultCommandTimeout": 10000
}
```

```javascript
Cypress.config() // => {defaultCommandTimeout: 10000, pageLoadTimeout: 30000, ...}
```

***

# Key Usage

## Return just a single configuration option value.

```javascript
// cypress.json
{
  "pageLoadTimeout": 60000
}
```

```javascript
Cypress.config("pageLoadTimeout") // => 60000
```

***

# Key Value Usage

## Cypress allows you to change the values of your configuration options from within your tests.

[block:callout]
{
  "type": "warning",
  "body": "Any value you change will be permanently changed for the remainder of your tests."
}
[/block]

```javascript
// cypress.json
{
  "viewportWidth": 1280,
  "viewportHeight": 720
}
```

```javascript
Cypress.config("viewportWidth", 800)

Cypress.config("viewportWidth") // => 800
```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe where we reset our baseUrl using Cypress.config](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js)",
  "title": "Using config to set baseUrl"
}
[/block]

***

# Object Usage

## You can set multiple values by passing an object literal.

```javascript
// cypress.json
{
  "defaultCommandTimeout": 4000,
  "pageLoadTimeout": 30000,
}
```

```javascript
Cypress.config({
  defaultCommandTimeout: 10000,
  viewportHeight: 900
})

Cypress.config() // => {defaultCommandTimeout: 10000, viewportHeight: 900, ...}
```

***

# Notes

## Why use `Cypress.config` instead of `cy.config`?

As a rule of thumb anything you call from `Cypress` affects global state. Anything you call from `cy` affects local state.

Methods on `cy` are local and specific to a single test. Side effects from `cy` methods are restored between each test. We chose to use `Cypress` because changes to your configuration options take effect for the remainder of **ALL** tests.

***

# Related

- [Configuration](https://on.cypress.io/guides/configuration)
