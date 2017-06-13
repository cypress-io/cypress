---
title: wrap
comments: true
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

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log

## Yields

`cy.wrap()` yields the object that was passed into the command.

## Timeout

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

<img width="467" alt="screen shot 2017-05-31 at 3 16 58 pm" src="https://cloud.githubusercontent.com/assets/1271364/26649531/50ad5a32-4614-11e7-9733-9432d7e831b3.png">

When clicking on the `wrap` command within the command log, the console outputs the following:

<img width="404" alt="screen shot 2017-05-31 at 3 17 05 pm" src="https://cloud.githubusercontent.com/assets/1271364/26649532/50ad77e2-4614-11e7-83ab-9d9d37daefb7.png">

# See also

- {% url `.invoke()` invoke %}
- {% url `.its()` its %}
- {% url `.spread()` spread %}
- {% url `.then()` then %}
