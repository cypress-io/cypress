---
title: route
comments: false
---

Use `cy.route()` to manage the behavior of network requests.

{% note info %}
**Note:** `cy.route()` assumes you are already familiar with core concepts such as {% url 'network requests' network-requests %}
{% endnote %}

# Syntax

```javascript
cy.route(url)
cy.route(url, response)
cy.route(method, url)
cy.route(method, url, response)
cy.route(callbackFn)
cy.route(options)
```

## Usage

**{% fa fa-check-circle green %} Correct Usage**

```javascript
cy.route('/users/**')  
```

## Arguments

**{% fa fa-angle-right %} url** ***(String, Glob, RegExp)***

Set a route matching the specific `url`.

**{% fa fa-angle-right %} response** ***(String, Object)***

Supply a response `body` to *stub* in the matching route.

**{% fa fa-angle-right %} method** ***(String)***

Match the route to a specific method (`GET`, `POST`, `PUT`, etc). If no method is defined, Cypress will match `GET` requests by default.

**{% fa fa-angle-right %} callbackFn** ***(Function)***

Set a route by returning an object literal from a callback function. Functions that return a `Promise` will automatically be awaited.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.route()`. By default `cy.route()` inherits its options from {% url `cy.server()` server %}.

Option | Default | Description
--- | --- | ---
`delay` | `0` | Delay for stubbed responses (in ms)
`force404` | `false` | Forcibly send XHR's a 404 status when the XHR's do not match any existing {% url `cy.route()` route %}.
`headers` | `null` | Response headers for stubbed routes
`method` | `GET` | Method to match against requests
`onAbort` | `null` | Callback function which fires anytime an XHR is aborted
`onRequest` | `null` | Callback function when a request is sent
`onResponse` | `null` | Callback function when a response is returned
`response` | `null` | Response body when stubbing routes
`status` | `200` | Response status code when stubbing routes
`url`    | `null` | String or RegExp url to match against request urls

You can also set options for all {% url `cy.wait()` wait %}'s `requestTimeout` and `responseTimeout` globally in {% url 'configuration' configuration %} to control how long to wait for the request and response of a supplied route.

## Yields {% helper_icon yields %}

{% yields null_alias cy.route %}

# Examples

## Without Stubbing

If you do not pass a `response` to a route, Cypress will pass the request through without stubbing it. We can still wait for the request to resolve later.

***Wait on XHR request matching `url`***

```javascript
cy.server()
cy.route('/users/**').as('getUsers')
cy.visit('/users')
cy.wait('@getUsers')
```

***Wait on XHR's matching `method` and `url`***

```javascript
cy.server()
cy.route('POST', /users/).as('postUser')
cy.visit('/users')
cy.get('#first-name').type('Julius{enter}')
cy.wait('@postUser')
```

***Setup route to `POST` to login***

{% note info %}
{% url "Check out our example recipe using `cy.route()` to POST for login" logging-in-recipe %}
{% endnote %}

***Wait on `url` matching glob***

Under the hood Cypress uses {% url 'minimatch' https://github.com/isaacs/minimatch %} to match glob patterns of `url`.

This means you can take advantage of `*` and `**` glob support. This makes it *much* easier to route against dynamic segments without having to build up a complex `RegExp`.

We expose {% url `Cypress.minimatch` minimatch %} as a function that you can use in your console to test routes.

***Match route against any UserId***

```javascript
cy.server()
cy.route('/users/*/comments')

// /users/123/comments     <-- matches
// /users/123/comments/465 <-- does not match
```

***Use glob to match all segments***

```javascript
cy.server()
cy.route('/posts/**')

// /posts/1            <-- matches
// /posts/foo/bar/baz  <-- matches
// /posts/quuz?a=b&1=2 <-- matches
```

***Override `url` glob matching options***

When we check `glob` patterns with {% url 'minimatch' https://github.com/isaacs/minimatch %}, by default Cypress uses sets `matchBase` to `true`. You can override this option in {% url `cy.server()` server %} options.

If you want to permanently override these options you could do so by setting {% url `Cypress.Server.defaults()` cypress-server %}.

```javascript
cy.server({
  urlMatchingOptions: { matchBase: false, dot: true }
})
cy.route(...)
```

## With Stubbing

If you pass a `response` to `cy.route()`, Cypress will stub the response in the request.

***`url` as a string***

When passing a `string` as the `url`, the XHR's URL must match *exactly* what you've written.

```javascript
cy.server()
cy.route('/users', [{id: 1, name: 'Pat'}])
```

***`url` as a RegExp***

When passing a RegExp as the `url`, the XHR's url will be tested against the regular expression and will apply if it passes.

```javascript
cy.server()
cy.route(/users\/\d+/, {id: 1, name: 'Phoebe'})
```

```javascript
// Application Code
$.get('/users/1337', (data) => {
  console.log(data) // => {id: 1, name: "Phoebe"}
})
```

***Response Functions***

You can also use a function as a response which enables you to add logic surrounding the response.

Functions that return a `Promise` will automatically be awaited.

```javascript
var commentsResponse = (routeData) => {
  //routeData is a reference to the current route's information
  return {
    data: someOtherFunction(routeData)
  }
}

cy.route('POST', '/comments/**', commentsResponse)
```

***Matching requests and routes***

Any request that matches the `method` and `url` of a route will be responded to based on the configuration of that route.

If a request doesn't match any route, [it will automatically receive a 404](#Notes). For example, given we have the following routes:

```javascript
cy.server()
cy.route(/users/, [
  {id: 19, name: 'Laura'},
  {id: 20, name: 'Jamie'}
])
cy.route('POST', /messages/, {id: 123, message: 'Hi There!'})
cy.get('form').submit()
```

```javascript
// Application Code
// when our form is submitted
$('form').submit(() => {
  // send an AJAX to: GET /users
  $.get('/users' )

  // send an AJAX to: POST /messages
  $.post('/messages', {some: 'data'})

  // send an AJAX to: GET /updates
  $.get('/updates')
})
```

**The above application code will issue 3 AJAX requests:**

1. The `GET /users` will match our 1st route and respond with a `200` status code and the array of users.
2. The `POST /messages` will match our 2nd route and respond with a `200` status code with the message object.
3. The `GET /updates` did not match any routes and its response automatically sent back a `404` status code with an empty response body.

***Specify the method***

The below example matches all `DELETE` requests to "/users" and stubs a response with an empty JSON object.

```javascript
cy.server()
cy.route('DELETE', '/users', {})
```

## Fixtures

Instead of writing a response inline you can automatically connect a response with a {% url `cy.fixture()` fixture %}.

```javascript
cy.server()
cy.route('/posts/*', 'fixture:logo.png').as('getLogo')
cy.route('/users/*', 'fixture:users/all.json').as('getUsers')
cy.route('/admin/*', 'fx:users/admin.json').as('getAdmin')
```

You may want to define the `cy.route()` after receiving the fixture and working with it's data.

```javascript
cy.fixture('user').then((user) => {
  user.firstName = 'Jane'
  // work with the users array here

  cy.route('GET', 'user/123', user)
})
cy.visit('/users')
cy.get('.user').should('include', 'Jane')
```

You can also reference fixtures as strings directly in the response by passing an aliased fixture with `@`.

```javascript
cy.fixture('user').as('fxUser')
cy.route('POST', '/users/*', '@fxUser')
```

## Options

***Pass in an options object***

```javascript
cy.server()
cy.route({
  method: 'DELETE',
  url: '/user/*',
  status: 412,
  response: {
    rolesCount: 2
  },
  delay: 500,
  headers: {
    'X-Token': null
  },
  onRequest: (xhr) => {
    // do something with the
    // raw XHR object when the
    // request initially goes out
  },
  onResponse: (xhr) => {
    // do something with the
    // raw XHR object when the
    // response comes back
  }
})
```

***Simulate a server redirect***

Below we simulate the server returning `503` with a stubbed empty JSON response body.

```javascript
cy.route({
  method: 'POST',
  url: '/login',
  response: {
    // simulate a redirect to another page
    redirect: '/error'
  }
})
```

***Setup route to error on POST to login***

{% note info %}
{% url "Check out our example recipe using `cy.route()` to simulate a `503` on `POST` to login" logging-in-recipe %}
{% endnote %}

***Change `headers`***

By default, Cypress will automatically set `Content-Type` and `Content-Length` based on what your `response body` looks like.

If you'd like to override this, explicitly pass in `headers` as an object literal.

```javascript
cy.route({
  url: 'image.png',
  response: 'fx:logo.png,binary' // binary encoding
  headers: {
    // set content-type headers
    'content-type': 'binary/octet-stream'
  }
})
```

***Using delays for route responses***

You can pass in a `delay` option that causes a delay (in ms) to the `response` for matched requests. The example below will cause the response to be delayed by 3 secs.

```javascript
cy.route({
  method: 'PATCH',
  url: '/activities/*',
  response: {},
  delay: 3000
})
```

## Function

***Set the routing options by a callback function***

```javascript
cy.route(() => {
  // ...do some custom logic here..

  // and return an appropriate routing object here
  return {
    method: 'POST',
    url: '/users/*/comments',
    response: this.commentsFixture
  }
})
```

***Functions that return promises are awaited***

```javascript
cy.route(() => {
  // a silly example of async return
  return new Cypress.Promise((resolve) =>{
    // resolve this promise after 1 second
    setTimeout(() => {
      resolve({
        method: 'PUT'
        url: '/posts/**'
        response: '@postFixture'
      })
    }, 1000)
  })
})
```

# Notes

## Debugging

***Understanding Stubbed vs Regular XHR's***

Cypress indicates whether an XHR sent back a stubbed response or actually went out to a server in it's Command Log

XHR's that display `(XHR STUB)` in the Command Log have been stubbed and their response, status, headers, and delay have been controlled by your matching `cy.route()`.

XHR's that display `(XHR)` in the Command Log have *not* been stubbed and were passed directly through to a server.

![XHR Command Log when not stubbed](/img/api/route/xhr-stub-versus-not-stubbed-routes-in-command-log.png)

Cypress also logs whether the XHR was stubbed or not to the console when you click on the command in the Command Log. It will indicate whether a request was stubbed, which url it matched or that it did not match any routes.

![XHR Command Log stubbed](/img/api/route/console-log-shows-if-route-was-stubbed-also.png)

Even the `Initiator` is included, which is a stack trace to what caused the XHR to be sent.

## Matches

***Matching origins and non origin URL's***

When Cypress matches up an outgoing XHR request to a `cy.route()`, it actually attempts to match it against both the fully qualified URL and then additionally without the URL's origin.

```javascript
cy.route('/users/*')
```

The following XHR's which were `xhr.open(...)` with these URLs would:

**Match:**
- `/users/1`
- `http://localhost:2020/users/2`
- `https://google.com/users/3`

**Not Match:**
- `/users/4/foo`
- `http://localhost:2020/users/5/foo`

## No matches

***Requests that don't match any routes***

You can force routes that do not match a route to return `404`:

Status | Body | Headers
--- | --- | ---
`404` | "" | `null`

If you'd like to enable this behavior you need to pass:

```javascript
cy.server({force404: true})
```

You can {% url 'read more about this here.' server#Options %}

# Rules

## Requirements {% helper_icon requirements %}

{% requirements parent cy.route %}

## Assertions {% helper_icon assertions %}

{% assertions none cy.route %}

## Timeouts {% helper_icon timeout %}

{% timeouts none cy.route %}

# Command Log

```javascript
cy.server()
cy.route(/accounts/).as('accountsGet')
cy.route(/company/, 'fixtures:company').as('companyGet')
cy.route(/teams/,   'fixtures:teams').as('teamsGet')
```

Whenever you start a server and add routes, Cypress will display a new Instrument Log called *Routes*. It will list the routing table in the Instrument Log, including the `method`, `url`, `stubbed`, `alias` and number of matched requests:

![Command Log routing table](/img/api/route/routing-table-displayed-in-command-log-for-cy-route.png)

When XHR's are made, Cypress will log them in the Command Log and indicate whether they matched a routing alias:

![Command Log XHR alias route](/img/api/route/some-xhr-responses-including-200-and-500-status-codes.png)

When clicking on `XHR Stub` within the Command Log, the console outputs the following:

![Console Log](/img/api/route/console-log-shows-status-duration-response-request-and-other-data-for-routing.png)

# See also

- {% url `.as()` as %}
- {% url `cy.fixture()` fixture %}
- {% url `cy.server()` server %}
- {% url `cy.wait()` wait %}
- {% url 'Guide: Network Requests' network-requests %}
- {% url 'Recipe: Logging in - XHR Web Form' logging-in-recipe %}
