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
Cypress.Commands.add('loginByForm', (username, password) => {

  Cypress.log({
    name: 'loginByForm',
    message: username + ' | ' + password
  })

  return cy.request({
    method: 'POST',
    url: '/login',
    form: true,
    body: {
      username: username,
      password: password
    }
  })
})

beforeEach(function(){
  // login before each test
  cy.loginByForm('jane.lane', 'password123')
})
```

***Another custom command for sign in***

```javascript
Cypress.Commands.add('loginByCSRF', (csrfToken) => {
  cy.request({
    method: 'POST',
    url: '/login',
    failOnStatusCode: false, // dont fail so we can make assertions
    form: true, // we are submitting a regular form body
    body: {
      username: 'cypress',
      password: 'password123',
      _csrf: csrfToken // insert this as part of form body
    }
  })
})

it('403 status without a valid CSRF token', function(){
  cy.loginByCSRF('invalid-token')
    .its('status')
    .should('eq', 403)
})
```

***Login with single signon command***

```javascript
Cypress.Commands.add('loginBySingleSignOn', (overrides = {}) => {

  Cypress.log({
    name: 'loginBySingleSignOn'
  })

  const options = {
    method: 'POST',
    url: 'http://auth.corp.com:8086/login',
    qs: {
      // use qs to set query string to the url that creates
      // http://auth.corp.com:8080?redirectTo=http://localhost:8085/set_token
      redirectTo: 'http://localhost:8085/set_token'
    },
    form: true, // we are submitting a regular form body
    body: {
      username: 'jane.lane',
      password: 'password123',
    }
  }

  // allow us to override defaults with passed in overrides
  _.extend(options, overrides)

  cy.request(options)
})

it('can authenticate with cy.request', function(){
  cy.loginBySingleSignOn().then((resp) => {
    // yup this should all be good
    expect(resp.status).to.eq(200)
  })
})
```

***Login with JSON***

```javascript
Cypress.Commands.add('loginByJSON', (username, password) => {

  Cypress.log({
    name: 'loginByJSON',
    message: username + ' | ' + password
  })

  return cy.request({
    method: 'POST',
    url: '/login',
    body: {
      username: username,
      password: password
    }
  })
})

beforeEach(function(){
  // login before each test
  cy.loginByJSON('jane.lane', 'password123')
})
```

***Set local storage on each visit***

```javascript
Cypress.Commands.add('visitAuthed', function(path) {
  cy.server().visit("/#" + path, {
    onBeforeLoad: function(win) {
      win.localStorage.setItem('apiKey', Cypress.env('apiKey'))
    }
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

# See also

- {% url 'Recipe: Logging In' logging-in-recipe %}
