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

`.clear()` requires being chained off another cy command that *yields* an `input` or `textarea`.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('[type="text"]').clear()        // Clear text input
cy.get('textarea').type('Hi!').clear() // Clear textarea
cy.focused().clear()                   // Clear focused input/textarea
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.clear()                // Errors, cannot be chained off 'cy'
cy.get('nav').clear()     // Errors, 'get' doesn't yield input or textarea
cy.url().clear()          // Errors, 'url' doesn't yield DOM element
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.clear()`.

Option | Default | Notes
--- | --- | ---
`force` | `false` | Force clear, disables error checking prior to clear
`interval` | `16` | Interval which to retry clear
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry the clear

## Yields

`.clear()` yields the `input` or `textarea` that was cleared.

## Timeout

`.clear()` will continue to look for the `input` or `textarea` for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Clear

**Clear the input and type a new value.**

Prior to clearing, if the element isn't currently focused, Cypress issues a {% url `.click()` click %} on the element, which causes the element to receive focus.

```javascript
cy.get('textarea').clear().type('Hello, World')
```

# Command Log

**Clear the input and type a new value**

```javascript
cy.get('input[name="name"]').clear().type('Jane Lane')
```

The commands above will display in the command log as:

![Command log for clear](https://cloud.githubusercontent.com/assets/1271364/11458939/bac1f4dc-9698-11e5-8e20-1ed9405f3d30.png)

When clicking on `clear` within the command log, the console outputs the following:

![console.log for clear](https://cloud.githubusercontent.com/assets/1271364/11458940/bdc93a50-9698-11e5-8be7-ef6a0470c3ae.png)

# See also

- {% url `.blur()` blur %}
- {% url `.focus()` focus %}
- {% url `.type()` type %}
