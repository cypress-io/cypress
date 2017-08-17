---
title: Custom Commands
comments: false
---

Cypress comes with its own API for creating custom commands. In fact, the same public methods *you* have access to are the same ones we use to create all of the built in commands. In other words, there's nothing special or different about ours versus yours. You can customize every aspect of commands, not only their behavior, but also their display in the Command Log.

This allows you to build up specific commands for your application which take their own custom arguments, and perform their own custom behavior.

For example, the first custom command you'll probably create is the canonical `login` command. This typically would navigate the user to your `/login` url, fill out a username / password combination, submit the form, and then assert that the dashboard page comes up (or whatever happens upon successful login).

{% note info  %}
A great place to define these commands is in your `cypress/support/commands.js` file, since it is loaded before any test files are evaluated.
{% endnote %}

# [Cypress.addChildCommand()]()

Child commands are always chained off of a **parent** command, or another **child** command.

***

# [Cypress.addDualCommand]()

While parent commands always start a new chain of commands and child commands require being chained off a parent command, dual commands can behave as parent or child command. That is, they can **start** a new chain, or be chained off of an **existing** chain.

***

# [Cypress.addParentCommand](#add-parent-command-usage)

Parent commands always **begin** a new chain of commands. Even if you've written a previous chain, parent commands will always start a new chain, and ignore previous chains.

***

# Add Parent Command Usage

## Custom command for 'login'
```javascript
Cypress.addParentCommand("login", function(email, password){
  var email    = email || "joe@example.com"
  var password = password || "foobar"

  var log = Cypress.Log.command({
    name: "login",
    message: [email, password],
    onConsole: function(){
      return {
        email: email,
        password: password
      }
    }
  })

  cy
    .visit("/login", {log: false})
    .contains("Log In", {log: false})
    .get("#email", {log: false}).type(email, {log: false})
    .get("#password", {log: false}).type(password, {log: false})
    .get("button", {log: false}).click({log: false}) //this should submit the form
    .get("h1", {log: false}).contains("Dashboard", {log: false}) //we should be on the dashboard now
    .url({log: false}).should("match", /dashboard/, {log: false})
    .then(function(){
      log.snapshot().end()
    })
})
```

## Another custom command for sign in

```javascript
Cypress.addParentCommand("signIn", function(email, password) {
  return cy.chain()
  .request({
    method: "POST",
    url: "/auth",
    body: {email, password}
  }).its("body");
});

describe("custom command", function() {
  it("resolves with the body", function() {
    // the subject (body) is carried on and
    // we can then add assertions about it
    cy.signIn({"jane.lane", "password123"}).should("deep.eq", {
      email: "jane.lane",
      password: "password123"
    });
  });
});
```

## Using cy.chain to manage a command's subject

```javascript
Cypress.addParentCommand("a", function(){
  cy
    .chain()
    .wrap({foo: "bar"})
    .its("foo")
})

Cypress.addChildCommand("b", function(subj){
  cy
    .chain()
    .wrap(subj)
    .should("eq", "bar")
})

it("can chain subjects", function(){
  cy
    .a()
    .b()
    .should("eq", "bar")
})
```
