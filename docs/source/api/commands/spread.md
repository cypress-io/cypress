---
title: spread
comments: false
---

Expand an array into multiple arguments.

{% note info %}
Identical to {% url `.then()` then %}, but always expects an array-like structure as it's subject.
{% endnote %}

# Syntax

```javascript
.spread(callbackFn)
.spread(options, callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.getCookies.spread(function() {}) // Yield all cookies
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.spread(function() {}) // Errors, cannot be chained off 'cy'
cy.location().spread()   // Errors, 'location' does not yield an array
```

## Arguments

**{% fa fa-angle-right %} fn** ***(Function)***

Pass a function that expands the array into it's arguments.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.spread()`.

Option | Default | Description
--- | --- | ---
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .spread %}

## Yields {% helper_icon yields %}

{% yields maybe_changes_subject .spread 'yields the return value of your callback function' %}

# Examples

## Aliased Routes

***Expand the array of aliased routes***

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

***Expand the array of cookies***

```javascript
cy.getCookies().spread(function(cookie1, cookie2, cookie3){
  // each cookie is now an individual argument
})
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements spread .spread %}

## Assertions {% helper_icon assertions %}

{% assertions once .spread %}

## Timeouts {% helper_icon timeout %}

{% timeouts promises .spread %}

# Command Log

`.spread()` does *not* log in the command log

# See also

- {% url `.each()` each %}
- {% url `.then()` then %}
