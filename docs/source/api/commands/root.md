---
title: root
comments: false
---

Get the root element.

# Syntax

```javascript
cy.root()
cy.root(options)
```

## Usage

`cy.root()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.root()   // Yield root element (document)
cy.get('nav').within(function(nav) {
  cy.root()  // Yield root element (nav)
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

`.root()` yields the root element regardless of what was yielded from a previous command.

The root element yielded is `document` by default. However, when calling `.root()` from within the callback function of a {% url `.within()` within %} command, the root element yielded is the yielded subject of the {% url `.within()` within %} command.

## Requirements {% helper_icon requirements %}

{% requirements parent cy.root %}

## Timeouts {% helper_icon timeout %}

{% timeouts assertions cy.root %}

# Examples

## Document

**Get the root element**

```javascript
cy.get('aside').root() // yields document
```

## Root in {% url `.within()` within %}

**Get the root element in a `.within()` callback function**

```javascript
cy.get('form').within(function (form) {
  cy.get('input[name="email"]').type('john.doe@email.com')
  cy.get('input[name="password"]').type('password')
  cy.root().submit() // submits the form yielded from 'within'
})
```

# Command Log

**Get root element**

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
