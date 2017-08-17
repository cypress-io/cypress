---
title: root
comments: false
---

Get the root DOM element.

# Syntax

```javascript
cy.root()
cy.root(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.root()   // Yield root element <html>
cy.get('nav').within(function(nav) {
  cy.root()  // Yield root element <nav>
})
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `.root()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | {% usage_options timeout cy.root %}

## Yields {% helper_icon yields %}

`.root()` yields the root DOM element.

The root element yielded is `<html>` by default. However, when calling `.root()` from a {% url `.within()` within %} command, the root element will point to the element you are "within".

# Examples

## HTML

***Get the root element***

```javascript
cy.root() // yields <html>
```

## Within

***Get the root element in a {% url `.within()` within %} callback function***

```javascript
cy.get('form').within(($form) => {
  cy.get('input[name="email"]').type('john.doe@email.com')
  cy.get('input[name="password"]').type('password')
  cy.root().submit() // submits the form yielded from 'within'
})
```

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.root %}

## Assertions {% helper_icon assertions %}

{% assertions retry cy.root %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions cy.root %}

# Command Log

***Get root element***

```javascript
cy.root().should('match', 'html')

cy.get('.query-ul').within(function(){
  cy.root().should('have.class', 'query-ul')
})
```

The commands above will display in the command log as:

![Command Log root](/img/api/root/find-root-element-and-assert.png)

When clicking on the `root` command within the command log, the console outputs the following:

![Console Log root](/img/api/root/console-log-root-which-is-usually-the-main-document.png)

# See also

- {% url `cy.get()` get %}
- {% url `.within()` within %}
