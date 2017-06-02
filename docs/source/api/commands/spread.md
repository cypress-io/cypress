---
title: spread
comments: true
description: ''
---

Expand an array into multiple arguments.

{% note info %}
Similar to [`.then()`](https://on.cypress.io/api/then), but always expects an array as it's subject.
{% endnote %}

# Syntax

```javascript
.spread(fn)
```

## Usage

`.spread()` requires being chained off another cy command that *yields* an array.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.getCookies.spread(function() {}) // Yield all cookies
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.spread(function() {}) // Errors, cannot be chained off 'cy'
cy.location().spread()   // Errors, 'location' does not yield an array
```

## Arguments

**{% fa fa-angle-right %} fn** ***(Function)***

Pass a function that expands the array into it's arguments.

## Yields

Whatever was passed to the function is what is yielded.

## Timeout

# Examples

## Aliased Routes

**Expand the array of aliased routes**

```javascript
cy.server()
cy.route('/users/').as('getUsers')
cy.route('/activities/').as('getActivities')
cy.route('/comments/').as('getComments')
cy.wait(['@getUsers', '@getActivities', '@getComments'])
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

- [getCookies](https://on.cypress.io/api/getCookies)
- [then](https://on.cypress.io/api/then)
- [wait](https://on.cypress.io/api/wait)
