---
title: visit
comments: false
---

Visit a remote URL.

# Syntax

```javascript
cy.visit(url)
cy.visit(url, options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.visit('http://localhost:3000')    // Yields the window of the remote page
```

## Arguments

**{% fa fa-angle-right %} url** ***(String)***

The URL to visit.

Cypress will be prefix the URL with the `baseUrl` configured in your {% url 'network options' configuration#Global %} if you've set one.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.visit()`.

Option | Default | Description
--- | --- | ---
`log` | `true` | {% usage_options log %}
`onBeforeLoad` | `function` | Called before your page has loaded all of its resources.
`onLoad` | `function` | Called once your page has fired its load event.
`timeout` | {% url `pageLoadTimeout` configuration#Timeouts %} | {% usage_options timeout cy.visit %}

You can also set all `cy.visit()` commands' `pageLoadTimeout` and `baseUrl` globally in {% url 'configuration' configuration %}.

## Yields {% helper_icon yields %}

{% yields sets_subject cy.visit 'yields the `window` object after the page finishes loading' %}

# Examples

## Url

***Visit a local server running on `http://localhost:8000`***

`cy.visit()` resolves when the remote page fires its `load` event.

```javascript
cy.visit('http://localhost:8000')
```

## Options

***Change the default timeout***

```javascript
// Wait 30 seconds for page 'load' event
cy.visit('/index.html', { timeout: 30000 })
```

***Provide an `onBeforeLoad` callback function***

`onBeforeLoad` is called as soon as possible, before your page has loaded all of its resources. Your scripts will not be ready at this point, but it's a great hook to potentially manipulate the page.

```javascript
cy.visit('http://localhost:3000/#dashboard', {
  onBeforeLoad: function(contentWindow){
    // contentWindow is the remote page's window object
  }
})
```

***Using onBeforeLoad***

{% note info %}
Check out our example recipes using `cy.visit()`'s `onBeforeLoad` option to:
  - {% url 'Bootstrap app data' working-with-the-backend-recipe %}
  - {% url 'Set a token to `localStorage` for login' logging-in-recipe %}
  - {% url 'Stub `window.fetch`' stubs-spies-and-clocks-recipe %}
{% endnote %}

***Provide an `onLoad` callback function***

`onLoad` is called once your page has fires its `load` event. All of the scripts, stylesheets, html and other resources are guaranteed to be available at this point.

```javascript
cy.visit('http://localhost:3000/#/users', {
  onLoad: function(contentWindow){
    // contentWindow is the remote page's window object
    if (contentWindow.angular) {
      // do something
    }
  }
})
```

# Notes

## Redirects

***Visit will automatically follow redirects***

```javascript
// we aren't logged in, so our webserver
// redirected us to /login
cy.visit('http://localhost3000/admin')
cy.url().should('match', /login/)
```

## Protocol

***Protocol can be omitted from common hosts***

Cypress automatically prepends the `http://` protocol to common hosts.  If you're not using one of these 3 hosts, then make sure to provide the protocol.

```javascript
cy.visit('localhost:3000') // Visits http://localhost:3000
cy.visit('0.0.0.0:3000')   // Visits http://0.0.0.0:3000
cy.visit('127.0.0.1:3000') // Visits http://127.0.0.1:3000
```

## Web Server

***Cypress can optionally act as your web server***

Cypress will automatically attempt to serve your files if you don't provide a host. The path should be relative to your project's root folder (where `cypress.json` is located).

Having Cypress serve your files is useful in simple projects and example apps, but isn't recommended for real apps.  It is always better to run your own server and provide the url to Cypress.

```javascript
cy.visit('app/index.html')
```

## Prefixes

***Visit is automatically prefixed with `baseUrl`.***

Configure `baseUrl` in the `cypress.json` file to prevent repeating yourself in every single `cy.visit()` command. Read more about {% url 'configuration' configuration %}.

```json
{
  "baseUrl": "http://localhost:3000/#/"
}
```

```javascript
cy.visit('dashboard') // Visits http://localhost:3000/#/dashboard
```

## Window

***Visit will always yield the remote page's window object when it resolves***

```javascript
cy.visit('index.html').then(function(contentWindow)){
  // contentWindow is the remote page's window object
})
```

## Routing

***Preventing XHR / AJAX requests before a remote page initially loads***

One common scenario Cypress supports is visiting a remote page and also preventing any AJAX requests from immediately going out.

You may think this works:

```javascript
// this code may not work depending on implementation
cy.visit('http://localhost:8000/#/app')
cy.server()
cy.route('/users/**', 'fx:users')
```

But if your app makes a request upon being initialized, *the above code will not work*. `cy.visit()` will resolve once its `load` event fires.  The {% url `cy.server()` server %} and {% url `cy.route()` route %} commands are not processed until *after* `cy.visit()` resolves.

Many applications will have already begun routing, initialization, and requests by the time the `cy.visit()` in the above code resolves. Therefore creating a {% url `cy.server()` server %} will happen too late, and Cypress will not process the requests.

Luckily Cypress supports this use case. Simply reverse the order of the commands:

```javascript
// this code is probably want you want
cy.server()
cy.route('/users/**', {...})
cy.visit('http://localhost:8000/#/app')
```

Cypress will automatically apply the server and routes to the very next `cy.visit()` and does so immediately before any of your application code runs.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements page cy.visit %}

## Assertions {% helper_icon assertions %}

{% assertions wait cy.visit %}

## Timeouts {% helper_icon timeout %}

{% timeouts page cy.visit %}

# Command Log

***Visit example application in a `beforeEach`***

```javascript
beforeEach(function(){
  cy.visit('https://example.cypress.io/commands/viewport')
})
```

The commands above will display in the command log as:

![Command Log visit](/img/api/visit/visit-example-page-in-before-each-of-test.png)

When clicking on `visit` within the command log, the console outputs the following:

![Console log visit](/img/api/visit/visit-shows-any-redirect-or-cookies-set-in-the-console.png)

# See also

- {% url `cy.go()` go %}
- {% url `cy.reload()` reload %}
- {% url `cy.request()` request %}
- {% url "Recipe: Bootstrapping App Test Data" working-with-the-backend-recipe %}
- {% url "Recipe: Logging In - Single Sign on" logging-in-recipe %}
- {% url "Recipe: Stubbing `window.fetch`" stubs-spies-and-clocks-recipe %}
