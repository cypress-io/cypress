---
title: visit
comments: true
---

Visit a remote url.

# Syntax

```javascript
cy.visit(url)
cy.visit(url, options)
```

## Usage

`cy.visit()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.visit('http://localhost:3000')    
```

## Arguments

**{% fa fa-angle-right %} url** ***(String)***

The url to visit. The url provided will be prefixed with the `baseUrl` configured in your [network options](https://on.cypress.io/guides/configuration#global).

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.visit()`.

Option | Default | Notes
--- | --- | ---
`log` | `true` | Whether to display command in Command Log
`onBeforeLoad` | `function` | Called before your page has loaded all of its resources.
`onLoad`       | `function` | Called once your page has fired its load event.
`timeout`      | [pageLoadTimeout](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait until `cy.visit()` resolves

You can also set all `cy.visit()` commands' `pageLoadTimeout` and `baseUrl` globally in [configuration](https://on.cypress.io/guides/configuration).

## Yields

`cy.visit()` yields the remote `window` object.

## Timeout

`cy.visit()` will retry for the duration of the [pageLoadTimeout](https://on.cypress.io/guides/configuration#timeouts) or the duration of the `timeout` specified in the command's [options](#options).

# Examples

## Visit

**Visit a local server running on `http://localhost:8000`**

`cy.visit()` resolves when the remote page fires its `load` event.

```javascript
cy.visit('http://localhost:8000')
```

**Protocol can be omitted from common hosts**

Cypress automatically prepends the `http://` protocol to common hosts.  If you're not using one of these 3 hosts, then make sure to provide the protocol.

```javascript
cy.visit('localhost:3000') // Visits http://localhost:3000
cy.visit('0.0.0.0:3000')   // Visits http://0.0.0.0:3000
cy.visit('127.0.0.1:3000') // Visits http://127.0.0.1:3000
```

**Cypress can optionally act as your web server**

Cypress will automatically attempt to serve your files if you don't provide a host. The path should be relative to your project's root folder (where `cypress.json` is located).

Having Cypress serve your files is useful in simple projects and example apps, but isn't recommended for real apps.  It is always better to run your own server and provide the url to Cypress.

```javascript
cy.visit('app/index.html')
```

**Visit is automatically prefixed with `baseUrl`.**

Configure `baseUrl` in the `cypress.json` file to prevent repeating yourself in every single `cy.visit()` command. Read more about [`configuration`](https://on.cypress.io/guides/configuration).

```json
{
  "baseUrl": "http://localhost:3000/#/"
}
```

```javascript
cy.visit('dashboard') // Visits http://localhost:3000/#/dashboard
```

## Options

**Change the default timeout**

```javascript
// Wait 30 seconds for page 'load' event
cy.visit('/index.html', { timeout: 30000 })
```

**Provide an `onBeforeLoad` callback function**

`onBeforeLoad` is called as soon as possible, before your page has loaded all of its resources. Your scripts will not be ready at this point, but it's a great hook to potentially manipulate the page.

```javascript
cy.visit('http://localhost:3000/#dashboard', {
  onBeforeLoad: function(contentWindow){
    // contentWindow is the remote page's window object
  }
})
```

**Using onBeforeLoad**

{% note info %}
Check out our example recipes using `cy.visit`'s `onBeforeLoad` option to [help bootstrap app data](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js), to [set a token to localStorage for login](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js) and to [stub window.fetch](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)
{% endnote %}

**Provide an `onLoad` callback function**

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

**Visit will always yield the remote page's window object when it resolves**

```javascript
cy.visit('index.html').then(function(contentWindow)){
  // contentWindow is the remote page's window object
})
```

**Visit will automatically follow redirects**

```javascript
// we aren't logged in, so our webserver
// redirected us to /login
cy.visit('http://localhost3000/admin')
cy.url().should('match', /login/)
```

**Preventing XHR / AJAX requests before a remote page initially loads**

One common scenario Cypress supports is visiting a remote page and also preventing any AJAX requests from immediately going out.

You may think this works:

```javascript
// this code may not work depending on implementation
cy.visit('http://localhost:8000/#/app')
cy.server()
cy.route('/users/**', 'fx:users')
```

But if your app makes a request upon being initialized, *the above code will not work*. `cy.visit()` will resolve once its `load` event fires.  The [`cy.server()`](https://on.cypress.io/api/server) and [`cy.route()`](https://on.cypress.io/api/route) commands are not processed until *after* `cy.visit()` resolves.

Many applications will have already begun routing, initialization, and requests by the time the `cy.visit()` in the above code resolves. Therefore creating a [`cy.server()`](https://on.cypress.io/api/server) will happen too late, and Cypress will not process the requests.

Luckily Cypress supports this use case. Simply reverse the order of the commands:

```javascript
// this code is probably want you want
cy.server()
cy.route('/users/**', {...})
cy.visit('http://localhost:8000/#/app')
```

Cypress will automatically apply the server and routes to the very next `cy.visit()` and does so immediately before any of your application code runs.

# See also

- [go](https://on.cypress.io/api/go)
- [Recipe: Bootstrapping App Test Data](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)
- [Recipe: Logging In - Single Sign on](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js)
- [request](https://on.cypress.io/api/request)
- [server](https://on.cypress.io/api/server)
