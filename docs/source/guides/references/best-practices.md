---
title: Best Practices
comments: false
layout: toc-top
---

## Using your UI to Build Up State

- use cy.request
- seed the database
- use stubbing
- modify cookies
- modify local storage
- mock / stub methods

Mostly WIP.

Began {% url 'discussing here' testing-your-app#Testing-Strategies %}.

## Acting Too Much like a User

WIP.

## Testing like you did with Selenium

WIP.

## Testing Across Domains

WIP.

## Creating too many Abstractions

WIP.

## Logging Out after each Test

WIP.

## Overusing `.then()`

WIP.

## Avoid 3rd Party Services

WIP.

## Adding Promises Unnecessarily

WIP.

## Mutating State Between Tests

WIP.

## Running too many Tests at Once

WIP.

## Putting up with Slow Tests

WIP.

## Writing E2E Tests only for Production

WIP.

## Running all the Tests in GUI Mode

WIP.

## Splitting up the "One Giant Test"

WIP.

## Unnecessary Waiting

{% note danger %}
{% fa fa-warning %} **Anti-Pattern:** Waiting for arbitrary time periods using {% url `cy.wait(Number)` wait#Time %}.
{% endnote %}

{% note success %}
{% fa fa-check-circle %} **Best Practice:** Use route aliases or assertions to guard Cypress from proceeding until an explicit condition is met.
{% endnote %}

In Cypress, you almost never need to use `cy.wait()` for an arbitrary amount of time. If you are finding yourself doing this, there is likely a much better, simpler way.

Let's imagine the following examples:

***Unnecessary wait for `cy.request()`***

Waiting here is unnecessary since the {% url `cy.request()` request %} command will not resolve until it receives a response from your server. Adding the wait here only adds 5 seconds after the {% url `cy.request()` request %} has already resolved.

```javascript
cy.request("http://localhost:8080/db/seed")
cy.wait(5000)     // <--- this is unnecessary
```

***Unnecessary wait for `cy.visit()`***

Waiting for this is unnecessary because the {% url '`cy.visit()`' visit %} resolves once the page fires its `load` event. By that time all of your assets have been loaded including javascript, stylesheets, and html.

```javascript
cy.visit("http://localhost/8080")
cy.wait(5000)     // <--- this is unnecessary
```

***Unnecessary wait for `cy.get()`***

Waiting for the {% url `cy.get()` get %} below is unnecessary because {% url `cy.get()` get %} automatically retries until the table's `tr` has a length of 2.

Whenever commands have an assertion they will not resolve until their associated assertions pass. This enables you to simply describe the state of your application without having to worry about when it gets there.

```javascript
cy.server()
cy.route("GET", /users/, [{"name": "Maggy"}, {"name": "Joan"}])
cy.get("#fetch").click()
cy.wait(4000)     // <--- this is unnecessary
cy.get("table tr").should("have.length", 2)
```

Alternatively a better solution to this problem is by waiting explicitly for an aliased route.

```javascript
cy.server()
cy.route("GET", /users/, [{"name": "Maggy"}, {"name": "Joan"}]).as("getUsers")
cy.get("#fetch").click()
cy.wait("@getUsers")     // <--- wait explicitly for this route to finish
cy.get("table tr").should("have.length", 2)
```

## Web Servers

{% note danger %}
{% fa fa-warning %} **Anti-Pattern:** Trying to a start a webserver from within Cypress scripts with {% url `cy.exec()` exec %}.
{% endnote %}

{% note success %}
{% fa fa-check-circle %} **Best Practice:** Start a webserver prior to running Cypress in GUI mode or headless mode.
{% endnote %}

We do NOT recommend trying to start your backend web server from within Cypress.

`cy.exec()` can only run commands which eventually exit.

Trying to start a web server from `cy.exec()` causes all kinds of problems because:

- You have to background the process
- You lose access to it via terminal
- You don't have access to its `stdout` or logs
- Every time your tests run, you'd have to work out the complexity around starting an already running web server.
- You would likely encounter constant port conflicts

**Why can't I shut down the process in an `after` hook?**

Because there is no guarantee that code running in an `after` will always run.

While working in the Cypress GUI you can always restart / refresh while in the middle of a test. When that happens, code in an `after` won't execute.

**What should I do then?**

Simple. Start your web server before running Cypress. That's it!
