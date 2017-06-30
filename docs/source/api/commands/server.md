---
title: server
comments: false
---

Start a server to begin routing responses to `cy.route()` and `cy.request()`.

{% note info %}
**Note:** `cy.server()` assumes you are already familiar with core concepts such as {% url 'network requests' network-requests %}.
{% endnote %}


# Syntax

```javascript
cy.server()
cy.server(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.server()    
```

## Arguments

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.server()`. These options are used for 2 different purposes:

  - As defaults that are merged into {% url `cy.route()` route %}.

  - As configuration behavior for *all* requests.

***The following options are merged in as default options to {% url `cy.route()` route %}***

Option | Default | Description
--- | --- | ---
`delay` | `0` | delay for stubbed responses (in ms)
`headers` | `null` | response headers for stubbed routes
`method` | `"GET"` | method to match against requests
`onAbort` | `undefined` | callback function which fires anytime an XHR is aborted
`onRequest` | `undefined` | callback function when a request is sent
`onResponse` | `undefined` | callback function when a response is returned
`response` | `null` | response body when stubbing routes
`status` | `200` | response status code when stubbing routes

***The following options control the behavior of the server affecting all requests:***

Option | Default | Description
--- | --- | ---
`enable` | `true` | pass `false` to disable existing route stubs
`force404` | `false` | forcibly send XHR's a 404 status when the XHR's do not match any existing
`urlMatchingOptions` | `{ matchBase: true }` | The default options passed to `minimatch` when using glob strings to match URLs
`whitelist` | function | Callback function that whitelists requests from ever being logged or stubbed. By default this matches against asset-like requests such as for `.js`, `.jsx`, `.html`, and `.css` files.

## Yields {% helper_icon yields %}

{% yields null cy.server %}

# Examples

## No Args

***After starting a server:***

- Any request that does not match a {% url `cy.route()` route %} will be sent a `404` status code.
- Any request that matches the `options.whitelist` function will **NOT** be logged or stubbed. In other words it is "whitelisted" and ignored.
- You will see requests named as `(XHR Stub)` or `(XHR)` in the Command Log.

```javascript
cy.server()
```

## Options

***Change defaults for {% url `cy.route()` route %}***

By default {% url `cy.route()` route %} inherits some of its options from `cy.server()`.

In this example, our matching requests will be delayed 1000ms and have a status of `422`, but its `response` will be what was set in {% url `cy.route()` route %}.

```javascript
cy.server({
  method: 'POST',
  delay: 1000,
  status: 422,
  response: {}
})

cy.route('/users/', {errors: 'Name cannot be blank'})
```

***Change the default delay for all routes***

Adding delay can help simulate real world network latency. Normally stubbed responses return in under 20ms. Adding a delay can help you visualize how your application's state reacts to requests that are in flight.

```javascript
// delay each route's response 1500ms
cy.server({delay: 1500})
```

***Prevent sending 404's to unmatched requests***

If you'd like Cypress to automatically send requests that do *NOT* match routes the following:

Status | Body | Headers
--- | --- | ---
`404` | "" | `null`

Simply set `force404` to `true`.

```javascript
cy.server({ force404: true })
cy.route('/activities/**', 'fixture:activities.json')
```

```javascript
// Application Code
$(function(){
  $.get('/activities')

  // this will be sent back 404 since it
  // does not match any of the cy.routes
  $.getJSON('/users.json')
})
```

***Change the default response headers for all routes***

When you stub requests, you can automatically control their response `headers`. This is useful when you want to send back meta data in the `headers`, such as *pagination* or *token* information.

{% note info  %}
Cypress automatically sets `Content-Length` and `Content-Type` based on the response `body` you stub.
{% endnote %}

```javascript
cy.server({
    headers: {
      'x-token': 'abc-123-foo-bar'
    }
  })
cy.route('GET', '/users/1', {id: 1, name: 'Amanda'}).as('getUser')
cy.visit('/users/1/profile')
cy.wait('@getUser').its('responseHeaders')
  .should('have.property', 'x-token', 'abc-123-foo-bar') // true
```

```javascript
// Application Code

// lets use the native XHR object
var xhr = new XMLHttpRequest

xhr.open('GET', '/users/1')

xhr.onload = function(){
  var token = this.getResponseHeader('x-token')
  console.log(token) // => abc-123-foo-bar
}

xhr.send()
```

***Change the default whitelisting***

`cy.server()` comes with a `whitelist` function that by default filters out any requests that are for static assets like `.html`, `.js`, `.jsx`, and `.css`.

Any request that passes the `whitelist` will be ignored - it will not be logged nor will it be stubbed in any way (even if it matches a specific {% url `cy.route()` route %}).

The idea is that we never want to interfere with static assets that are fetched via AJAX.

**The default whitelist function in Cypress is:**

```javascript
var whitelist = function(xhr){
  // this function receives the xhr object in question and
  // will whitelist if its a GET that appears to be a static resource
  xhr.method === 'GET' && /\.(jsx?|html|css)(\?.*)?$/.test(xhr.url)
}
```

**You can override this function with your own specific logic:**

```javascript
cy.server({
  whitelist: function(xhr){
    // specify your own function that should return
    // truthy if you want this xhr to be ignored,
    // not logged, and not stubbed.
  }
})
```

If you would like to change the default option for **ALL** `cy.server()` you [can change this option permanently](#permanently-override-default-server-options).

***Turn off the server after you've started it***

You can disable all stubbing and its effects and restore it to the default behavior as a test is running. By setting `enable` to `false`, this disables stubbing routes and XHR's will no longer show up as (XHR Stub) in the Command Log. However, routing aliases can continue to be used and will continue to match requests, but will not affect responses.

```javascript
cy.server()
cy.route('POST', '/users', {}).as('createUser')
cy.server({enable: false})
```

# Notes

***Server persists until the next test runs***

Cypress automatically continues to persist the server and routing configuration even after a test ends. This means you can continue to use your application and still benefit from stubbing or other server configuration.

However between tests, when a new test runs, the previous configuration is restored to a clean state. No configuration leaks between tests.

***Outstanding requests are automatically aborted between tests***

When a new test runs, any outstanding requests still in flight are automatically aborted. In fact this happens by default whether or not you've even started a `cy.server()`.

***Server can be started before you {% url `cy.visit()` visit %}***

Oftentimes your application may make initial requests immediately when it loads (such as authenticating a user). Cypress makes it possible to start your server and define routes before a {% url `cy.visit()` visit %}. Upon the next visit, the server + routes will be instantly applied before your application loads.

You can {% url 'read more about XHR strategy here' network-requests %}.

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.server %}

## Assertions {% helper_icon assertions %}

{% assertions none cy.server %}

## Timeouts {% helper_icon timeout %}

{% timeouts none cy.server %}

# Command Log

- `cy.server()` does *not* log in the command log

# See also

- {% url 'Network Requests' network-requests %}
- {% url `cy.request()` request %}
- {% url `cy.route()` route %}
- {% url `cy.visit()` visit %}
- {% url `cy.wait()` wait %}
