---
title: spread
comments: false
---

Expand an array into multiple arguments.

{% note info %}
Similar to {% url `.then()` then %}, but always expects an array as it's subject.
{% endnote %}

# Syntax

```javascript
.spread(callbackFn)
.spread(options, callbackFn)
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

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.spread()`.

Option | Default | Notes
--- | --- | ---
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .spread %}

## Yields {% helper_icon yields %}

Whatever was passed to the function is what is yielded.

## Timeout {% helper_icon timeout %}

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

- {% url `.each()` each %}
- {% url `cy.getCookies()` getcookies %}
- {% url `.then()` then %}
- {% url `cy.wait()` wait %}
