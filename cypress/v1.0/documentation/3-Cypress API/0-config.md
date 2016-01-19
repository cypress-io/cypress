slug: config
excerpt: get and set configuration options

#### **New to Cypress?** [Read about configuration first.](http://on.cypress.io/guides/configuration)

***

`Cypress.config` allows you to `get` and `set` your configuration options.

This document covers the API for consuming your configuration options *in your tests*.

### [Cypress.config()](#no-arguments-usage)

Returns all of your configuration options as an object literal.

***

### [Cypress.config( *key* )](#key-usage)

Returns the value of a single configuration option by its key.

***

### [Cypress.config( *key*, *value* )](#key-value-usage)

Sets a configuration option for a specific key.

***

### [Cypress.config( *object* )](#object-usage)

Sets multiple configuration options.

***

## No Arguments Usage

Get all configuration options.

```javascript
// cypress.json
{
  "commandTimeout": 10000
}
```

```javascript
Cypress.config() // => {commandTimeout: 10000, visitTimeout: 30000, ...}
```

***

## Key Usage

Return just a single configuration option value.

```javascript
// cypress.json
{
  "visitTimeout": 60000
}
```

```javascript
Cypress.config("visitTimeout") // => 60000
```

***

## Key Value Usage

Cypress allows you to change the values of your configuration options from within your tests.

> **Note:** Any value you change will be permanently changed for the remainder of your tests.

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

***

## Object Usage

You can set multiple values by passing an object literal.

```javascript
// cypress.json
{
  "commandTimeout": 4000,
  "visitTimeout": 30000,
}
```

```javascript
Cypress.config({
  commandTimeout: 10000,
  viewportHeight: 900
})

Cypress.config() // => {commandTimeout: 10000, viewportHeight: 900, ...}
```

***

## Notes

#### Why did you use `Cypress.config` instead of `cy.config`?

As a rule of thumb anything you call from `Cypress` affects global state. Anything you call from `cy` affects local state.

Methods on `cy` are local and specific to a single test. Side effects from `cy` methods are restored between each test. We chose to use `Cypress` because changes to your configuration options take effect for the remainder of **ALL** tests.


