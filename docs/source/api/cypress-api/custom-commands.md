---
title: Custom Commands
comments: false
---

Cypress comes with its own API for creating custom commands. In fact, the same public methods *you* have access to from our API is used to build every command in our API.

{% note info  %}
A great place to define these commands is in your `cypress/support/commands.js` file, since it is loaded before any test files are evaluated.
{% endnote %}

# Syntax

```javascript
Cypress.Commands.add(name, callbackFn)
Cypress.Commands.add(name, options, callbackFn)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
Cypress.Commands.add('login', (email, pw) => {})
```

**{% fa fa-exclamation-triangle red %} Incorrect Usage**

```javascript
Cypress.add('login', (email, pw) => {})  // Errors, cannot be chained off 'Cypress'
cy.add('login', (email, pw) => {})  // Errors, cannot be chained off 'cy'
```

## Arguments

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Pass a function that takes the arguments passed to the command.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the behavior of the custom command.

Option | Default | Description
--- | --- | ---
`prevSubject` | `false` | how to handle the previously yielded subject.

The `prevSubject` accepts the following values:

- `true`: use the subject yielded from the previously chained command. (parent command)
- `false`: ignore any existing subject from previously chained command. (child command)
- `dom`: use the subject yielded from the previously chained command. Expects subject to be a DOM element. (child command)
- `optional`: may or may not have an existing subject (dual command)

# Examples

## Child Command

Child commands are always chained off of a **parent** command, or another **child** command.

***Custom command to right click on DOM element***

```javascript
Cypress.Commands.add('rightclick', {prevSubject: 'dom'}, function(subject, arg1, arg2){
  // enforces that the previous subject is DOM and the subject is yielded here
  // blows up and provides a great error when improperly chained
})
```

## Parent Command

Parent commands always **begin** a new chain of commands. Even if you've chained it off of a previous command, parent commands will always start a new chain, and ignore previously yielded subjects.

***Custom command for 'login'***

```javascript
Cypress.Commands.add('login', function(email, password){
  var email    = email || 'joe@example.com'
  var password = password || 'foobar'

  var log = Cypress.log({
    name: 'login',
    message: [email, password],
    onConsole: function(){
      return {
        email: email,
        password: password
      }
    }
  })

  cy.visit('/login', {log: false})
  cy.contains('Log In', {log: false})
  cy.get('#email', {log: false}).type(email, {log: false})
  cy.get('#password', {log: false}).type(password, {log: false})
  //this should submit the form
  cy.get('button', {log: false}).click({log: false})
  // we should be on the dashboard now
  cy.get('h1', {log: false}).contains('Dashboard', {log: false}) /
  cy.url({log: false}).should('match', /dashboard/, {log: false})
    .then(function(){
      log.snapshot().end()
    })
})
```

## Another custom command for sign in

```javascript
Cypress.Commands.add('signIn', function(email, password) {
  cy.request({
    method: 'POST',
    url: '/auth',
    body: {email, password}
  }).its('body')
})

describe('custom command', function() {
  it('resolves with the body', function() {
    // the subject (body) is carried on and
    // we can then add assertions about it
    cy.signIn({'jane.lane', 'password123'}).should('deep.eq', {
      email: 'jane.lane',
      password: 'password123'
    })
  })
})
```

## Dual Command

While parent commands always start a new chain of commands and child commands require being chained off a parent command, dual commands can behave as parent or child command. That is, they can **start** a new chain, or be chained off of an **existing** chain.

```javascript
Cypress.Commands.add('swipe', {prevSubject: 'optional'}, function(subject, arg1, arg2){
  // subject may or may not be undefined giving you the option to change the behavior
  // the most common dual command is cy.contains() which operates differently whether
  // there is an existing subject or not
})
```
