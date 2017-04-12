slug: server
excerpt: Control the behavior of network requests and responses

[block:callout]
{
  "type": "info",
  "body": "[Read about Network Requests first.](https://on.cypress.io/guides/network-requests-xhr)",
  "title": "New to Cypress?"
}
[/block]

Use `cy.server` to control the behavior of requests and responses.

***

# [cy.server()](#default-usage)

Start a server to begin routing responses to your requests.

***

# Options

Pass in an options object to change the default behavior of `cy.server`.

**[cy.server(*options* )](#options-usage)**

`cy.server` takes options that are used for 2 different purposes:

1. As defaults which are merged into [`cy.route`](https://on.cypress.io/api/route).
2. As configuration behavior for *all* requests.

The following options will be merged in as defaults to [`cy.route`](https://on.cypress.io/api/route)

Option | Default | Notes
--- | --- | ---
`delay` | `0` | Default delay for responses
`method` | `"GET"` | Default method to match against requests
`status` | `200` | Default response Status code
`headers` | `null` | Default response Headers
`response` | `null` | Default response Body
`onRequest` | `undefined` | Default callback function when a request is sent
`onResponse` | `undefined` | Default callback function when a response is returned
`onAbort` | `undefined` | Default callback function which fires anytime an XHR is aborted


The following options control the behavior of the server affecting all requests:

Option | Default | Notes
--- | --- | ---
`enable` | `true` | Pass `false` to disable existing route stubs
`force404` | `false` | Forces requests that don't match your routes to be sent back `404`.
`urlMatchingOptions` | `{ matchBase: true }` | The default options passed to `minimatch` when using glob strings to match URLs
`whitelist` | function | Callback function that whitelists requests from ever being logged or stubbed. By default this matches against asset-like requests such as `.js`, `.jsx`, `.html`, and `.css`

***

# Default Usage

## Start a server

```javascript
cy.server()
```

**After starting a server:**

- Any request that does not match a `cy.route` will be sent a `404` status code.
- Any request that matches the `options.whitelist` function will **NOT** be logged or stubbed. In other words it is "whitelisted" and ignored.
- You will see requests named as `(XHR Stub)` or `(XHR)` in the Command Log.

***

# Options Usage

## Change the defaults for upcoming `cy.route` commands

By default [`cy.route`](https://on.cypress.io/api/route) inherits its options from `cy.server`. Passing any of the following options to server will be inherited:

- delay
- method
- status
- headers
- response
- onRequest
- onResponse

```javascript
cy
  .server({
    method: "POST",
    delay: 1000,
    status: 422,
    response: {}
  })

  // our route command will now inherit its options
  // from the server. anything we pass specifically
  // to route will override the defaults.
  //
  // in this example our matching requests will
  // be delayed 1000ms and have a status of 422
  // but its response will be what we set in route
  .route(/users/, {errors: "Name cannot be blank"})

```

***

## Change the default delay for all routes

Adding delay can help simulate real world network latency. Normally stubbed responses return in under 20ms. Adding a delay can help you visualize how your application's state reacts to requests that are in flight.

```javascript
// delay each response 1500ms
cy.server({delay: 1500})
```

***

## Prevent sending 404's to unmatched requests

If you'd like Cypress to automatically send requests that do *NOT* match routes the following:

Status | Body | Headers
--- | --- | ---
`404` | "" | `null`

Simply set `{force404: true}`

```javascript
cy
  .server({force404: true})
  .route(/activities/, "fixture:activities.json")
```

```javascript

// Application Code

$(function(){
  $.get("/activities")

  // this will be sent back 404 since it
  // does not match any of the cy.routes
  $.getJSON("/users.json")
})
```

***

## Change the default response headers for all routes

When you stub requests, you can automatically control their response headers.

[block:callout]
{
  "type": "info",
  "body": "Cypress automatically sets `Content-Length` and `Content-Type` based on the response body you've stubbed"
}
[/block]

This is useful when you want to send back meta data in the headers, such as **pagination** or **token** information.

```javascript
cy
  .server({
    headers: {
      "x-token": "abc-123-foo-bar"
    }
  })
  .route("GET", "/users/1", {id: 1, name: "Amanda"}).as("getUser")
  .visit("/users/1/profile")
  .wait("@getUser")
    .its("responseHeaders")
    .should("have.property", "x-token", "abc-123-foo-bar") // true
```

```javascript
// Application Code

// lets use the native XHR object
var xhr = new XMLHttpRequest

xhr.open("GET", "/users/1")

xhr.onload = function(){
  var token = this.getResponseHeader("x-token")
  console.log(token) // => abc-123-foo-bar
}

xhr.send()

```

***

## Change the default whitelisting

Cypress comes with a `whitelist` function that will filter out any requests that are for static assets like `.html`, `.js`, `.jsx`, `.css`.

Any request that passes the `whitelist` will be ignored - it will not be logged nor will it be stubbed in any way (even if it matches a specific `cy.route`).

The idea is that we never went to interfere with static assets that are fetched via AJAX.

The default whitelist function is:

```javascript
var whitelist = function(xhr){
  // this function receives the xhr object in question and
  // will whitelist if its a GET that appears to be a static resource
  xhr.method === "GET" && /\.(jsx?|html|css)(\?.*)?$/.test(xhr.url)
}
```

You can override this function with your own specific logic.

```javascript
cy.server({
  whitelist: function(xhr){
    // specify your own function that should return
    // truthy if you want this xhr to be ignored,
    // not logged, and not stubbed.
  }
})
```

If you would like to change the default option for **ALL** `cy.server` you [can change this option permanently](#permanently-override-default-server-options).

***

## Turn off the server after you've started it

You can disable all stubbing and its effects and restore to the default behavior as a test is running.

```javascript
cy
  .server()
  .route("POST", /users/, {}).as("createUser")

  ...

  // this now disables stubbing routes and XHR's
  // will no longer show up as (XHR Stub) in the
  // Command Log. However routing aliases can
  // continue to be used and will continue to
  // match requests, but will not affect responses
  .server({enable: false})
```

***

# Notes

## Server persists until the next test runs

Cypress automatically continues to persist the server and routing configuration even after a test ends. This means you can continue to use your application and still benefit from stubbing or other server configuration.

However between tests, when a new test runs, the previous configuration is restored to a clean state. No configuration will leak between tests.

***

## Outstanding requests are automatically aborted between tests

When a new test runs, any oustanding requests still in flight are automatically aborted. In fact this happens by default whether or not you've even started a `cy.server`.

***

## Server can be started before you `cy.visit`

Oftentimes your application may make initial requests immediately when it loads (such as authenticating a user). Cypress makes it possible to start your server and define routes before a [`cy.visit`](https://on.cypress.io/api/visit). Upon the next visit, the server + routes will be instantly applied before your application loads.

You can [read more about XHR strategy here](https://on.cypress.io/guides/network-requests-xhr).

***

# Related

- [route](https://on.cypress.io/api/route)
- [wait](https://on.cypress.io/api/wait)
- [request](https://on.cypress.io/api/request)
- [visit](https://on.cypress.io/api/visit)
- [Network Requests](https://on.cypress.io/guides/network-requests-xhr)
