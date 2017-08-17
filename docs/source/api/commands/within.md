---
title: within
comments: false
---
Scopes all subsequent cy commands to within this element. Useful when working within a particular group of elements such as a `<form>`.

# Syntax

```javascript
.within(callbackFn)
.within(options, callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.get('.list').within(function(list) {}) // Yield the `.list` and scope all commands within it
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
cy.within(function() {})              // Errors, cannot be chained off 'cy'
cy.getCookies().within(function() {}) // Errors, 'getCookies' does not yield DOM element
```

## Arguments

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the current yielded subject as it's first argument.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.within()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}

## Yields {% helper_icon yields %}

{% yields same_subject .within %}

# Examples

## Forms

***Get inputs within a form and submit the form***

```html
<form>
  <input name="email" type="email">
  <input name="password" type="password">
  <button type="submit">Login</button>
</form>
```

```javascript
cy.get('form').within(($form) => {
  // cy.get() will only search for elements within form,
  // not within the entire document
  cy.get('input[name="email"]').type('john.doe@email.com')
  cy.get('input[name="password"]').type('password')
  cy.root().submit()
})
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements child .within %}

## Assertions {% helper_icon assertions %}

{% assertions once .within %}

## Timeouts {% helper_icon timeout %}

{% timeouts none .within %}

# Command Log

***Get the input within the form***

```javascript
cy.get('.query-form').within((el) => {
  cy.get('input:first')
})
```

The commands above will display in the command log as:

![Command Log](/img/api/within/go-within-other-dom-elements.png)

When clicking on the `within` command within the command log, the console outputs the following:

![Console Log](/img/api/within/within-shows-its-yield-in-console-log.png)

# See also

- {% url `.root()` root %}
