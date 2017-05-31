---
title: submit
comments: true
description: ''
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
cy.get('form').submit() // Submit a form
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.submit()               // Errors, cannot be chained off 'cy'
cy.get('input').submit()  // Errors, 'input' does not yield a form
```

## Arguments

**{% fa fa-angle-right %} options**  ***(Object)***

Pass in an options object to change the default behavior of `.submit()`.

## Yields

`.submit()` yields the form that was submitted.

## Timeout

`.submit()` will continue to try to submit the form for the duration of the [`defaultCommandTimeout`](https://on.cypress.io/guides/configuration#timeouts)

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

<img width="594" alt="screen shot 2015-11-29 at 1 21 43 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459081/3149d9e6-969c-11e5-85b2-ba57638f02df.png">

When clicking on `submit` within the command log, the console outputs the following:

![cy.submit console log](https://cloud.githubusercontent.com/assets/1271364/12888878/222f5522-ce4a-11e5-9edd-f67be2ebce40.png)

# See also

- [click](https://on.cypress.io/api/click)
