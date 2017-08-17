---
title: clear
comments: false
---

Clear the value of an `input` or `textarea`.

{% note info %}
An alias for {% url `.type('{selectall}{backspace}')` type %}
{% endnote %}

# Syntax

```javascript
.clear()
.clear(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('[type="text"]').clear()        // Clear text input
cy.get('textarea').type('Hi!').clear() // Clear textarea
cy.focused().clear()                   // Clear focused input/textarea
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.clear()                // Errors, cannot be chained off 'cy'
cy.get('nav').clear()     // Errors, 'get' doesn't yield input or textarea
cy.url().clear()          // Errors, 'url' doesn't yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.clear()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`force` | `false` | {% usage_options force clear %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .clear %}

## Yields {% helper_icon yields %}

{% yields same_subject .clear %}

# Examples

## No Args

**Clear the input and type a new value.**

```javascript
cy.get('textarea').clear().type('Hello, World')
```

# Notes

## Actionability

***The element must first reach actionability***

`.clear()` is an "action command" that follows all the rules {% url 'defined here' interacting-with-elements %}.

## Documentation

`.clear()` is just an alias for {% url `.type({selectall}{backspace})` type %}.

Please read the {% url `.type()` type %} documentation for more details.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements clearability .clear %}

## Assertions {% helper_icon assertions %}

{% assertions actions .clear %}

## Timeouts {% helper_icon timeout %}

{% timeouts actions .clear %}

# Command Log

**Clear the input and type a new value**

```javascript
cy.get('input[name="name"]').clear().type('Jane Lane')
```

The commands above will display in the command log as:

![Command log for clear](/img/api/clear/clear-input-in-cypress.png)

When clicking on `clear` within the command log, the console outputs the following:

![console.log for clear](/img/api/clear/one-input-cleared-in-tests.png)

# See also

- {% url `.blur()` blur %}
- {% url `.focus()` focus %}
- {% url `.type()` type %}
