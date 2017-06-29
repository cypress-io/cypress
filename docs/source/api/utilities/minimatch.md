---
title: Cypress.minimatch
comments: false
---

Cypress automatically includes {% url "minimatch" https://github.com/isaacs/minimatch %} and exposes it as `Cypress.minimatch`.

Use `Cypress.minimatch` to test out glob patterns against strings.

# Syntax

```javascript
Cypress.minimatch()
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.minimatch()
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.minimatch()  // Errors, cannot be chained off 'cy'
```

# Examples

By default Cypress uses `minimatch` to test glob patterns against XHR URLs.

If you're struggling with writing the correct pattern you can iterate much faster by testing directly in your Developer Tools console.

```javascript
// test that the glob you're writing matches the XHR's url

// returns true
Cypress.minimatch("/users/1/comments", "/users/*/comments", {
  matchBase: true
})

// returns false
Cypress.minimatch("/users/1/comments/2", "/users/*/comments", {
  matchBase: true
})
```

We're adding the `{ matchBase: true }` option because under the hood Cypress actually uses that option by default.

Now let's test out `**` support.

```javascript
// ** matches against all downstream path segments

// returns true
Cypress.minimatch("/foo/bar/baz/123/quux?a=b&c=2", "/foo/**", {
  matchBase: true
})

// whereas * matches only the next path segment

// returns false
Cypress.minimatch("/foo/bar/baz/123/quux?a=b&c=2", "/foo/*", {
  matchBase: false
})
```
