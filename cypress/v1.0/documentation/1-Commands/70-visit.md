slug: visit
excerpt: Visit a remote url

Visit a remote url. This will most likely be the first command you run. `cy.visit` resolves when the remote page fires its `load` event.

Visit is prefixed with the `baseUrl` configured in the [Network Options](https://on.cypress.io/guides/configuration#section-global).

Using `baseUrl` is a great way to prevent repeating yourself in every `cy.visit`.

| | |
|--- | --- |
| **Returns** | the remote page's window object |
| **Timeout** | `cy.visit` will retry for the duration of the [pageLoadTimeout](https://on.cypress.io/guides/configuration#section-timeouts) or the duration of the `timeout` specified in the command's [options](#section-options). |

***

# [cy.visit( *url* )](#section-usage)

Visit the specified url passed as a string.

***

# Options

Pass in an options object to change the default behavior of `cy.visit`.

**[cy.visit( *url*, *options* )](#section-options-usage)**

Option | Default | Notes
--- | --- | ---
`onBeforeLoad` | `function` | Called before your page has loaded all of its resources.
`onLoad`       | `function` | Called once your page has fired its load event.
`timeout`      | [pageLoadTimeout](https://on.cypress.io/guides/configuration#section-timeouts) | Total time to wait until `cy.visit` resolves
`log` | `true` | whether to display command in command log

You can also set options for all `cy.visit` `pageLoadTimeout` and `baseUrl` globally in [configuration](https://on.cypress.io/guides/configuration).

***

# Usage

## Visit a local server running on http://localhost:8000

```javascript
cy.visit("http://localhost:8000")
```

***

## Protocol can be omitted from common hosts

```javascript
// Cypress will automatically prepend the http:// protocol
// to common hosts.  If you're not using one of these
// 3 hosts, then make sure to provide the protocol
cy.visit("localhost:3000") // => http://localhost:3000
cy.visit("0.0.0.0:3000")   // => http://0.0.0.0:3000
cy.visit("127.0.0.1:3000") // => http://127.0.0.1:3000
```

***

## Cypress can optionally act as your web server

Having Cypress serve your files is useful in simple projects and example apps, but isn't recommended for real apps.  It is always better to run your own server and provide the url to Cypress.

```javascript
// Cypress will automatically attempt to serve your files
// if you do not provide a host. The path should be relative
// to your project's root folder. The root folder is
// where cypress.json is stored.
cy.visit("app/index.html")
```

***

## Visit is automatically prefixed with `baseUrl`.

Simply configure `baseUrl` in the `cypress.json` file to prevent repeating yourself in every single `cy.visit(...)`. Read more about [`configuration`](https://on.cypress.io/guides/configuration).

```javascript
// cypress.json
{
  baseUrl: "http://localhost:3000/#/"
}
```

```javascript
// this will visit the complete url
// http://localhost:3000/#/dashboard
cy.visit("dashboard")
```

***

# Options Usage

## Change the default timeout

```javascript
// change the timeout to be 30 seconds
cy.visit("/index.html", {timeout: 30000})
```

***

## Provide an `onBeforeLoad` callback function

```javascript
// onBeforeLoad is called as soon as possible, before
// your page has loaded all of its resources.  Your scripts
// will not be ready at this point, but it's a great hook
// to potentially manipulate the page.
cy.visit("http://localhost:3000/#dashboard", {
  onBeforeLoad: function(contentWindow){
    // contentWindow is the remote page's window object
  }
})
```

[block:callout]
{
  "type": "info",
  "body": "Check out our example recipes using cy.visit's onBeforeLoad option to [help bootstrap app data](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js), to [set a token to localStorage for login](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js) and to [stub window.fetch](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)",
  "title": "Using onBeforeLoad"
}
[/block]

***

## Provide an `onLoad` callback function

```javascript
// onLoad is called once your page has fired its load event.
// all of the scripts, stylesheets, html and other resources
// are guaranteed to be available at this point.
cy.visit("http://localhost:3000/#/users", {
  onLoad: function(contentWindow){
    // contentWindow is the remote page's window object
    if(contentWindow.angular){
      // do something
    }
  }
})
```

***

# Notes

## Visit will always yield the remote page's window object when it resolves

```javascript
cy.visit("index.html").then(function(contentWindow)){
  // contentWindow is the remote page's window object
}
```

***

## Visit will automatically follow redirects

```javascript
// we aren't logged in, and our webserver
// redirects us to /login
cy
  .visit("http://localhost3000/admin")
  .url().should("match", /login/)
```

***

## Cypress automatically wipes page state between visits

Whenever you `cy.visit()`, Cypress will automatically wipe the state of the page before navigating to an external page.

Internally Cypress will visit `about:blank` which flushes the window.

```javascript
// internally this does the following:
// visit 'dashboard'
// visit 'about:blank'
// visit 'users'
cy
  .visit("dashboard")

  ...more commands...

  .visit("users")

```

***

## Preventing XHR / AJAX requests before a remote page initially loads

One common scenario Cypress supports is visiting a remote page and also preventing any AJAX requests from immediately going out.

You may think this works:

```javascript
cy
  .visit("http://localhost:8000/#/app")
  .server()
  .route(/users/, {...})
```

But if your app makes a request upon being initialized, *the above code will not work*.  `cy.visit()` will resolve once its `load` event fires.  The `server` and `route` commands are not processed until *after* `visit` resolves.

Many applications will have already begun routing, initialization, and requests by the time `visit` resolves. Therefore creating a `cy.server` will happen too late, and Cypress will not process the requests.

Luckily Cypress supports this use case easily. Simply reverse the order of the commands:

```javascript
cy
  .server()
  .route(/users/, {...})
  .visit("http://localhost:8000/#/app")
```

Cypress will automatically apply the server and routes to the very next `visit` and does so immediately before any of your application code runs.

***

# Related

- [Recipe: Bootstrapping App Test Data](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)
- [Recipe: Logging In - Single Sign on](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js)
- [go](https://on.cypress.io/api/go)
- [server](https://on.cypress.io/api/server)
