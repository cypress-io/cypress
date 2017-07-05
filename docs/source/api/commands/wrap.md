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

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.wrap({ name: "Jane Lane" })    
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

{% yields sets_subject cy.wrap 'yields the object it was called with' %}

# Examples

## Objects

***Invokes the function on the subject in wrap and returns the new value.***

```javascript
const getName = () => {
  return 'Jane Lane'
}

cy.wrap({ name: getName }).invoke('name').should('eq', 'Jane Lane') // true
```

## Elements

***Wrap elements to continue executing commands***

```javascript
cy.get('form').within(($form) => {
  // ... more commands

  cy.wrap($form).should('have.class', 'form-container')
})
```

***Conditionally wrap elements***

```javascript
cy
  .get('button')
  .then(($button) => {
    // $el is a wrapped jQuery element
    if ($button.someMethod() === 'something') {
      // wrap this element so we can
      // use cypress commands on it
      cy.wrap($button).click()
    } else {
      // do something else
    }
  })
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.wrap %}

## Assertions {% helper_icon assertions %}

{% assertions retry cy.wrap %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions cy.wrap %}

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
