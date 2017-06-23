---
title: submit
comments: false
---

Submit a form.

# Syntax

```javascript
.submit()
.submit(options)
```

## Usage

`.submit()` requires being chained off another cy command that *yields* a form.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('form').submit()   // Submit a form
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.submit()               // Errors, cannot be chained off 'cy'
cy.get('input').submit()  // Errors, 'input' does not yield a form
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.submit()`.

## Yields {% yields %}

`.submit()` yields the form that was submitted.

## Timeout {% timeout %}

`.submit()` will continue to try to submit the form for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

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
