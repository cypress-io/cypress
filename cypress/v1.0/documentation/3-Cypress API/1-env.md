slug: env
excerpt: get and set environment variables

`Cypress.env` allows you to `get` and `set` your environment variables.

This document covers the API for consuming your environment variables *in your tests*. The [Environment Variable](https://on.cypress.io/guides/environment-variables) guide explains the 4 ways you can set them *outside of your tests*.

[block:callout]
{
  "type": "info",
  "body": "[Read about environment variables first.](https://on.cypress.io/guides/environment-variables)",
  "title": "New to Cypress?"
}
[/block]

# [Cypress.env()](#section-no-arguments-usage)

Returns all of your environment variables as an object literal.

***

# [Cypress.env( *key* )](#section-key-usage)

Returns the value of a single environment variable by its key.

***

# [Cypress.env( *key*, *value* )](#section-key-value-usage)

Sets an environment variable for a specific key.

***

# [Cypress.env( *object* )](#section-object-usage)

Sets multiple environment variables.

***

# No Arguments Usage

## Get all environment variables.

```javascript
// cypress.json
{
  "env": {
    "foo": "bar",
    "baz": "quux"
  }
}
```

```javascript
Cypress.env() // => {foo: "bar", baz: "quux"}
```

***

# Key Usage

## Return just a single environment variable value.

```javascript
// cypress.json
{
  "env": {
    "foo": "bar",
    "baz": "quux"
  }
}
```

```javascript
Cypress.env("foo") // => bar
Cypress.env("baz") // => quux
```

***

# Key Value Usage

## Cypress allows you to change the values of your environment variables from within your tests.

[block:callout]
{
  "type": "warning",
  "body": "Any value you change will be permanently changed for the remainder of your tests."
}
[/block]

```javascript
// cypress.json
{
  "env": {
    "foo": "bar",
    "baz": "quux"
  }
}
```

```javascript
Cypress.env("host", "http://server.dev.local")

Cypress.env("host") // => http://server.dev.local
```

***

# Object Usage

## You can set multiple values by passing an object literal.

```javascript
// cypress.json
{
  "env": {
    "foo": "bar",
    "baz": "quux"
  }
}
```

```javascript
Cypress.env({
  host: "http://server.dev.local",
  foo: "foo"
})

Cypress.env() // => {foo: "foo", baz: "quux", host: "http://server.dev.local"}
```

***

# Notes

## Why use `Cypress.env` instead of `cy.env`?

As a rule of thumb anything you call from `Cypress` affects global state. Anything you call from `cy` affects local state.

Methods on `cy` are local and specific to a single test. Side effects from `cy` methods are restored between each test. We chose to use `Cypress` because changes to your environment variables take effect for the remainder of **ALL** tests.

***

## Why would I ever need to use environment variables?

The [Environment Variables](https://on.cypress.io/guides/environment-variables) guide explains common use cases.

***

## Can I pass in environment variables from the command line?

Yes. You can do that and much more.

The [Environment Variables](https://on.cypress.io/guides/environment-variables) guide explains the 4 ways you can set environment variables for your tests.
