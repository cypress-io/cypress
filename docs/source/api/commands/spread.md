---
title: spread
comments: true
description: ''
---

Expand an expression into multiple arguments.

{% note info %}
Similar of [`.then()`](https://on.cypress.io/api/then), but always expects an array as it's subject.
{% endnote %}

# Syntax

```javascript
.spread(function() {})
```

## Usage

`.spread()` requires being chained off another cy command that *yields* an array.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.getCookies.spread(function() {}) // Yield all el's with class '.users'
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.spread(function() {}) // Errors, cannot be chained off 'cy'
cy.location().spread()   // Errors, 'location' does not yield an array
```

## Arguments

**{% fa fa-angle-right %} function** ***(Function)***

Pass a function that expands the array into it's arguments. Whatever was passed to the function is what is yielded.

## Yields

## Timeout

# Examples

## Aliased Routes

**Expand the array of aliased routes**

```javascript
cy
  .server()
  .route('/users/').as('getUsers')
  .route('/activities/').as('getActivities')
  .route('/comments/').as('getComments')
  .wait(['@getUsers', '@getActivities', '@getComments'])
  .spread(function(getUsers, getActivities, getComments){
    // each XHR is now an individual argument
  })
```

## Cookies

**Expand the array of cookies**

```javascript
cy.getCookies().spread(function(cookie1, cookie2, cookie3){
  // each cookie is now an individual argument
})
```

# Command Log

**`spread` does *not* log in the command log**

# See also

- [then](https://on.cypress.io/api/then)
- [wait](https://on.cypress.io/api/wait)
