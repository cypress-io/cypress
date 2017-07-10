---
title: Cypress.config
comments: false
---

`get` and `set` configuration options *in your tests*.

{% note info New to Cypress? %}
{% url 'Read about configuration first.' configuration %}
{% endnote %}

# Syntax

```javascript
Cypress.config()
Cypress.config(name)
Cypress.config(name, value)
Cypress.config(object)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.config() // Get configuration options
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.config()  // Errors, cannot be chained off 'cy'
```

## Arguments

**{% fa fa-angle-right %} name**  ***(String)***

The name of the configuration to get or set.

**{% fa fa-angle-right %} value**  ***(String)***

The value of the configuration to set.

**{% fa fa-angle-right %} object**  ***(Object)***

Set multiple configuration options with an object literal.

# Examples

## No Arguments

**Get all configuration options.**


```javascript
// cypress.json

{
  "defaultCommandTimeout": 10000
}
```

```javascript
Cypress.config() // => {defaultCommandTimeout: 10000, pageLoadTimeout: 30000, ...}
```

## Name

**Return just a single configuration option value.**


```javascript
// cypress.json

{
  "pageLoadTimeout": 60000
}
```

```javascript
Cypress.config("pageLoadTimeout") // => 60000
```

## Name and Value

**Cypress allows you to change the values of your configuration options from within your tests.**

{% note warning %}
Any value you change will be permanently changed for the remainder of your tests.
{% endnote %}


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

**Using config to set `baseUrl`**

{% note info %}
{% url "Check out our example recipe where we reset our `baseUrl` using `Cypress.config()`" logging-in-recipe %}
{% endnote %}

## Object

**You can set multiple values by passing an object literal.**


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

# Notes

**Why use `Cypress.config` instead of `cy.config`?**

As a rule of thumb anything you call from `Cypress` affects global state. Anything you call from `cy` affects local state.

Methods on `cy` are local and specific to a single test. Side effects from `cy` methods are restored between each test. We chose to use `Cypress` because changes to your configuration options take effect for the remainder of **ALL** tests.

# See also

- {% url 'configuration' configuration %}
