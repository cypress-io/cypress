---
title: within
comments: false
---

Set the scope of the containing commands to the previously yielded subject and pass that as an argument to the callback function.

# Syntax

```javascript
.within(callbackFn)
.within(options, callbackFn)
```

## Usage

`.within()` requires being chained off another cy command that *yields* a DOM element.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.list').within(function(list) {}) // Yield the `.list` and scope all commands within it
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.within(function() {})              // Errors, cannot be chained off 'cy'
cy.getCookies().within(function() {}) // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the current yielded subject as it's first argument.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.within()`.

Option | Default | Notes
--- | --- | ---
`log` | `false` | Display command in command log

## Yields

## Timeout

# Examples

## Within

**Get inputs within a form and submit the form**

```html
<form>
  <input name="email" type="email">
  <input name="password" type="password">
  <button type="submit">Login</button>
</form>
```

```javascript
cy.get('form').within(function(form){
  // cy.get() will only search for elements within form,
  // not within the entire document
  cy.get('input[name="email"]').type('john.doe@email.com')
  cy.get('input[name="password"]').type('password')
  cy.wrap(form).submit()
})
```

# Command Log

**Get the input within the form**

```javascript
cy.get('.query-form').within(function(el){
  cy.get('input:first')
})
```

The commands above will display in the command log as:

<img width="461" alt="screen shot 2017-05-31 at 2 53 31 pm" src="https://cloud.githubusercontent.com/assets/1271364/26648611/05e133a0-4611-11e7-883e-735bc65cf739.png">

When clicking on the `within` command within the command log, the console outputs the following:

<img width="468" alt="screen shot 2017-05-31 at 2 53 49 pm" src="https://cloud.githubusercontent.com/assets/1271364/26648610/05d540fe-4611-11e7-9d20-d67c714beb6b.png">

# See also

- {% url `.root()` root %}
