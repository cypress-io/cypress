---
title: get
comments: false
---

Get one or more DOM elements by selector or [alias](https://on.cypress.io/guides/using-aliases).

# Syntax

```javascript
cy.get(selector)
cy.get(alias)
cy.get(selector, options)
cy.get(alias, options)
```

## Usage

`cy.get()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.list>li')    // Yield the li's in '.list'
```

## Arguments

**{% fa fa-angle-right %} selector** ***(String selector)***

A selector used to filter matching DOM elements.

**{% fa fa-angle-right %} alias** ***(String)***

An alias as defined using the {% url `.as()` as %} command and referenced with the `@` character and the name of the alias.

Internally, Cypress keeps a cache of all aliased elements.  If the element currently exists in the DOM, it is immediately returned.  If the element no longer exists, Cypress will re-query the element based on the previous selector path defined before {% url `.as()` as %} to find it again.

{% note info %}
[Read about using aliases here.](https://on.cypress.io/guides/using-aliases)
{% endnote %}

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.get()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`timeout` | {% url `defaultCommandTimeout` configuration#Timeouts %} | Total time to retry getting the element

## Yields

`cy.get()` yields the new DOM element(s) found by the command.

## Timeout

`cy.get()` will continue to look for the elements for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}.

# Examples

## Selector

**Get the input element**

```javascript
cy.get('input').should('be.disabled')
```

**Find the first li descendent within a ul**

```javascript
cy.get('ul li:first').should('have.class', 'active')
```

**Find the the dropdown-menu and click it.**

```javascript
cy.get('.dropdown-menu').click()
```

## Get in Within

**`cy.get()` in the {% url `.within()` within %} command**

Since `cy.get()` is chained off of `cy`, it always looks for the selector within the entire `document`. The only exception is when used inside a [`.within()`]() command.

```javascript
cy.get('form').within(function(){
  cy.get('input').type('Pamela')            // Only yield inputs within form
  cy.get('textarea').type('is a developer') // Only yield textareas within form
})
```

## Alias

For a detailed explanation of aliasing, [read more about aliasing here](https://on.cypress.io/guides/using-aliases).

**Get the aliased 'todos' elements**

```javascript
cy.get('ul#todos').as('todos')

//...hack hack hack...

//later retrieve the todos
cy.get('@todos')
```

**Get the aliased 'submitBtn' element**

```javascript
beforeEach(function(){
  cy.get('button[type=submit]').as('submitBtn')
})

it('disables on click', function(){
  cy.get('@submitBtn').should('be.disabled')
})
```

# Command Log

**Get an input and assert on the value**

```javascript
cy.get('input[name="firstName"]').should('have.value', 'Homer')
```

The commands above will display in the command log as:

<img width="524" alt="screen shot 2015-11-27 at 1 24 20 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446808/5d2f2180-950a-11e5-8645-4f0f14321f86.png">

When clicking on the `get` command within the command log, the console outputs the following:

<img width="543" alt="screen shot 2015-11-27 at 1 24 45 pm" src="https://cloud.githubusercontent.com/assets/1271364/11446809/61a6f4f4-950a-11e5-9b23-a9efa1fbccfc.png">

# See also

- {% url `.as()` as %}
- {% url `cy.contains()` contains %}
- {% url `.find()` find %}
- {% url `.within()` within %}
