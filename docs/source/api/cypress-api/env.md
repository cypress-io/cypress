---
title: Cypress.env
comments: false
---

`get` and `set` environment variables *in your tests*.

{% note info %}
The {% url 'Environment Variable' environment-variables %} guide explains the 4 ways you can set them *outside of your tests*.
{% endnote %}

# Syntax

```javascript
Cypress.env()
Cypress.env(name)
Cypress.env(name, value)
Cypress.env(object)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.env() // Get environment variables
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.env()  // Errors, cannot be chained off 'cy'
```

## Arguments

**{% fa fa-angle-right %} name**  ***(String)***

The name of the environment variable to get or set.

**{% fa fa-angle-right %} value**  ***(String)***

The value of the environment variable to set.

**{% fa fa-angle-right %} object**  ***(Object)***

Set multiple environment variables with an object literal.

# Examples

## No Arguments

**Get all environment variables.**


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

## Name

**Return just a single environment variable value.**


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

# Name and Value

**Cypress allows you to change the values of your environment variables from within your tests.**

{% note warning  %}
Any value you change will be permanently changed for the remainder of your tests.
{% endnote %}


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

## Object

**You can set multiple values by passing an object literal.**


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

# Notes

**Why use `Cypress.env` instead of `cy.env`?**

As a rule of thumb anything you call from `Cypress` affects global state. Anything you call from `cy` affects local state.

Methods on `cy` are local and specific to a single test. Side effects from `cy` methods are restored between each test. We chose to use `Cypress` because changes to your environment variables take effect for the remainder of **ALL** tests.

**Why would I ever need to use environment variables?**

The {% url 'Environment Variables' environment-variables %} guide explains common use cases.

**Can I pass in environment variables from the command line?**

Yes. You can do that and much more.

The {% url 'Environment Variables' environment-variables %} guide explains the 4 ways you can set environment variables for your tests.
