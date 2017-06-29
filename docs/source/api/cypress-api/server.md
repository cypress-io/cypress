---
title: Cypress.Server
comments: false
---

Permanently change the default options for all {% url `cy.server()` server %} instances

{% note info New to Cypress? %}
Any configuration you pass to {% url `cy.server()` server %} will only persist until the end of the test.
{% endnote %}

# Syntax

```javascript
Cypress.Server.defaults(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.Server.defaults({}) // Set server defaults
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.Server.defaults({})  // Errors, cannot be chained off 'cy'
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.filter()`.

# Examples

## Options

**These options will be the new defaults.**

```javascript
// pass anything here you'd normally pass to cy.server().
Cypress.Server.defaults({
  delay: 500,
  force404: false,
  whitelist: function(xhr){
    // handle custom logic for whitelisting
  }
})
```

# Notes

**Where to put server configuration**

A great place to put this configuration is in your `cypress/support/defaults.js` file, since it is loaded before any test files are evaluated.

# See also

- {% url `cy.server()` server %}
