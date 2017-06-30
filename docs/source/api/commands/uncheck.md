---
title: uncheck
comments: false
---

Uncheck checkbox(es).

# Syntax

```javascript
.uncheck()
.uncheck(value)
.uncheck(values)
.uncheck(options)
.uncheck(value, options)
.uncheck(values, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('[type="checkbox"]').uncheck()   // Unchecks checkbox element
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.uncheck('[type="checkbox"]') // Errors, cannot be chained off 'cy'
cy.get('p:first').uncheck()     // Errors, '.get()' does not yield checkbox
```

## Arguments

**{% fa fa-angle-right %} value**  ***(String)***

Value of checkbox that should be unchecked.

**{% fa fa-angle-right %} values**  ***(Array)***

Values of checkboxes that should be unchecked.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.uncheck()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`force` | `false` | {% usage_options force uncheck %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .uncheck %}

## Yields {% helper_icon yields %}

{% yields same_subject .uncheck %}

# Examples

## No Args

***Uncheck all checkboxes***

```javascript
cy.get(':checkbox').uncheck()
```

***Uncheck element with the id 'saveUserName'***

```javascript
cy.get('#saveUserName').uncheck()
```

## Value

***Uncheck the checkbox with the value of 'ga'***

```javascript
cy.get('input[type="checkbox"]').uncheck(['ga'])
```

## Values

***Uncheck the checkboxes with the values 'ga' and 'ca'***

```javascript
cy.get('[type="checkbox"]').uncheck(['ga', 'ca'])
```

# Notes

## Actionability

***The element must first reach actionability***

`.uncheck()` is an "action command" that follows all the rules {% url 'defined here' interacting-with-elements %}.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements checkability .uncheck %}

## Assertions {% helper_icon assertions %}

{% assertions actions .uncheck %}

## Timeouts {% helper_icon timeout %}

{% timeouts actions .uncheck %}

# Command Log

***Uncheck the first checkbox***

```javascript
cy
  .get('[data-js="choose-all"]').click()
  .find('input[type="checkbox"]').first().uncheck()
```

The commands above will display in the command log as:

![Command Log](/img/api/uncheck/test-unchecking-a-checkbox.png)

When clicking on `uncheck` within the command log, the console outputs the following:

![Console Log](/img/api/uncheck/console-shows-events-from-clicking-the-checkbox.png)

# See also

- {% url `.check()` check %}
- {% url `.click()` click %}
