---
title: check
comments: false
---

Check checkbox(es) or radio(s).

# Syntax

```javascript
.check()
.check(value)
.check(values)
.check(options)
.check(value, options)
.check(values, options)
```

## Usage

`.check()` requires being chained off another cy command that *yields* a DOM element of type `checkbox` or `radio`.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('[type="checkbox"]').check()       // Check checkbox element
cy.get('[type="radio"]').first().check()  // Check first radio element
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.check('[type="checkbox"]') // Errors, cannot be chained off 'cy'
cy.get('p:first').check()     // Errors, '.get()' does not yield checkbox or radio
```

## Arguments

**{% fa fa-angle-right %} value**  ***(String)***

Value of checkbox or radio that should be checked.

**{% fa fa-angle-right %} values**  ***(Array)***

Values of checkboxes or radios that should be checked.

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.check()`.

Option | Default | Notes
--- | --- | ---
`force` | `false` | Forces check, disables error checking prior to check
`interval` | `16` | Interval which to retry a check
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry the check
## Yields {% yields %}

## Default {% helper_icon defaultAssertion %}

`.check()` yields the DOM element(s) that were checked.

## Timeout {% helper_icon timeout %}

`.check` will retry for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %} or the duration of the `timeout` specified in the command's options.

# Examples

## Check

**Check all checkboxes**

```javascript
cy.get('[type="checkbox"]').check()
```

**Check all radios**

```javascript
cy.get('[type="radio"]').check()
```

**Check the element with id of 'saveUserName'**

```javascript
cy.get('#saveUserName').check()
```

## Value

**Select the radio with the value of 'US'**

```javascript
cy.get('[type="radio"]').check('US')
```

## Values

**Check the checkboxes with the values 'ga' and 'ca'**

```javascript
cy.get('[type="checkbox"]').check(['ga', 'ca'])
```

## Options

**Check an invisible checkbox**

You can ignore Cypress' default behavior of checking that the element is visible, clickable and not disabled by setting `force` to `true` in the options.

```javascript
cy.get('.action-checkboxes').should('not.be.visible') // Passes
  .check({ force: true }).should('be.checked')        // Passes
```

# Command Log

**check the element with name of 'emailUser'**

```javascript
cy.get('form').find('[name="emailUser"]').check()
```

The commands above will display in the command log as:

![Command log for check](/img/api/check/check-checkbox-in-cypress.png)

When clicking on `check` within the command log, the console outputs the following:

![console.log for check](/img/api/check/console-showing-events-on-check.png)

# See also

- {% url `.click()` click %}
- {% url `.uncheck()` uncheck %}
