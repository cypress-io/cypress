---
title: wrap
comments: false
---

Yield the object passed into `.wrap()`.

# Syntax

```javascript
cy.wrap(subject)
cy.wrap(subject, options)
```

## Usage

`cy.wrap()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.wrap({name: "Jane Lane"})    
```

## Arguments

**{% fa fa-angle-right %} subject** ***(Object)***

An object to be yielded.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.wrap()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout cy.wrap %}

## Yields {% helper_icon yields %}

`cy.wrap()` yields the object that was passed into the command.

## Timeouts {% helper_icon timeout %}

# Examples

## Wrap

**Invokes the function on the subject in wrap and returns the new value.**

```javascript
var getName = function() {
  return 'Jane Lane'
}

cy.wrap({name: getName}).invoke('name').should('eq', 'Jane Lane') // true
```

# Command Log

**Make assertions about object**

```javascript
cy.wrap({ amount: 10 })
  .should('have.property', 'amount')
  .and('eq', 10)
```

The commands above will display in the command log as:

![Command Log](/img/api/wrap/wrapped-object-in-cypress-tests.png)

When clicking on the `wrap` command within the command log, the console outputs the following:

![Console Log](/img/api/wrap/console-log-only-shows-yield-of-wrap.png)

# See also

- {% url `.invoke()` invoke %}
- {% url `.its()` its %}
- {% url `.spread()` spread %}
- {% url `.then()` then %}
