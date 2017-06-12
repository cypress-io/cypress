---
title: as
comments: true
---

Assign an alias for later use. Reference the alias later within a {% url `cy.get()` get %} or {% url `cy.wait()` wait %} command with a `@` prefix.

{% note info %}
**Note:** `.as()` assumes you are already familiar with core concepts such as [aliases](https://on.cypress.io/guides/using-aliases)
{% endnote %}

# Syntax

```javascript
.as(aliasName)
```

## Usage

`.as()` should be chained off another cy command.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.get('.main-nav').find('li').first().as('firstNav') // Alias first 'li' as @firstNav
cy.route('PUT', 'users', 'fx:user').as('putUser')     // Alias 'route' as @putUser   
cy.stub(api, 'onUnauth').as('unauth')                 // Alias 'stub' as @unauth   
cy.spy(win, 'fetch').as('winFetch')                   // Alias 'spy' as @winFetch  
```

**{% fa fa-exclamation-triangle red %} Invalid Usage**

```javascript
cy.as('foo')   // Errors, cannot be chained off 'cy'
```

## Arguments

**{% fa fa-angle-right %} aliasName** ***(String)***

The name of the alias to be referenced later within a {% url `cy.get()` get %} or {% url `cy.wait()` wait %} command using a `@` prefix.

## Yields

`.as()` yields the DOM element or route chained from the previous command.

## Timeout

`.as()` will retry the chain of commands before the `.as()` command for the duration of the {% url `defaultCommandTimeout` configuration#Timeouts %}

# Examples

## DOM Element

```javascript
cy
  .route('PUT', /^\/users\/\d+/, 'fixture:user').as('userPut')
  .get('form').submit()
  .wait('@userPut')
    .its('url').should('contain', 'users')
```

## Route

```javascript
cy
  .route('PUT', 'users', 'fx:user').as('userPut')
  .get('form').submit()
  .wait('@userPut')
    .its('url').should('contain', 'users')
```

# Notes

**Alias names cannot match some reserved words.**

Some strings are not allowed as alias names since they are reserved words in Cypress. These words include: `test`, `runnable`, `timeout`, `slow`, `skip`, and `inspect`.

# Command Log

**Alias several routes**

```javascript
cy
  .route(/company/, 'fixture:company').as('companyGet')
  .route(/roles/, 'fixture:roles').as('rolesGet')
  .route(/teams/, 'fixture:teams').as('teamsGet')
  .route(/users\/\d+/, 'fixture:user').as('userGet')
  .route('PUT', /^\/users\/\d+/, 'fixture:user').as('userPut')
```

Aliases of routes display in the routes instrument panel:

<img width="567" alt="screen shot 2015-11-29 at 2 25 47 pm" src="https://cloud.githubusercontent.com/assets/1271364/11459470/22e31e54-96a5-11e5-8895-a6ff5f8bb973.png">

# See also

- {% url `cy.get()` get %}
- [Using Aliases](https://on.cypress.io/guides/using-aliases)
- {% url `cy.wait()` wait %}
