---
title: submit
comments: false
---

Submit a form.

{% note warning %}
This element must be an `<form>`.
{% endnote %}

# Syntax

```javascript
.submit()
.submit(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('form').submit()   // Submit a form
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.submit()               // Errors, cannot be chained off 'cy'
cy.get('input').submit()  // Errors, 'input' does not yield a form
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.submit()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout .submit %}

## Yields {% helper_icon yields %}

{% yields same_subject .submit %}

# Example

## Submit a form

**Submit can only be called on a single form.**

```html
<form id="contact">
  <input type="text" name="message">
  <button type="submit">Send</button>
</form>
```

```javascript
cy.get('#contact').submit()
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements submitability .submit %}

## Assertions {% helper_icon assertions %}

{% assertions wait .submit %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions .submit %}

# Command Log

**Submit a form**

```javascript
cy.route('POST', '/users', 'fixture:user').as('userSuccess')
cy.get('form').submit()
```

The commands above will display in the command log as:

![Command Log](/img/api/submit/form-submit-shows-in-command-log-of-cypress.png)

When clicking on `submit` within the command log, the console outputs the following:

![cy.submit console log](/img/api/submit/console-shows-what-form-was-submitted.png)

# See also

- {% url `.click()` click %}
- {% url `.type()` type %}
