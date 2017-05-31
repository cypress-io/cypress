---
title: route
comments: true
description: ''
---

Use `cy.route` to manage the behavior of network requests.

{% note info New to Cypress? %}
[Read about Network Requests first.](https://on.cypress.io/guides/network-requests-xhr)
{% endnote %}

# Syntax

```javascript
cy.route(url)
cy.route(url, response)
cy.route(method, url)
cy.route(method, url, response)
cy.route(function() {})
cy.route(options)
```

## Usage

`cy.route()` cannot be chained off any other cy commands, so should be chained off of `cy` for clarity.

**{% fa fa-check-circle green %} Valid Usage**

```javascript
cy.route('/users/**')    
```

## Arguments

**{% fa fa-angle-right %} url** ***(String, Glob, RegExp)***

Set a route matching the specific `url` which is not stubbed but can be waited on later.

**{% fa fa-angle-right %} response** ***(String, Object)***

Supply a response body to *stub* in the matching route.

**{% fa fa-angle-right %} method** ***(String)***

Match the route to a specific method (`GET`, `POST`, `PUT`...). If no method is defined, Cypress will match `GET` requests by default.

**{% fa fa-angle-right %} function** ***(Function)***

Set a route by returning an object literal from a callback function.

Functions which return a promise will automatically be awaited.

**{% fa fa-angle-right %} options** ***(Object)***

Pass in an options object to change the default behavior of `cy.route`. By default `cy.route` inherits its options from [`cy.server`](https://on.cypress.io/api/server).

Option | Default | Notes
--- | --- | ---
`method` | `GET` | method to match against requests
`url`    | `null` | string or RegExp url to match against request urls
`response` | `null` | response body when stubbing routes
`status` | `200` | response status code when stubbing routes
`delay` | `0` | delay for stubbed responses (in ms)
`headers` | `null` | response headers for stubbed routes
`force404` | `false` | forcibly send XHR's a 404 status when the XHR's do not match any existing [`cy.routes`](https://on.cypress.io/api/routes)
`onRequest` | `null` | callback function when a request is sent
`onResponse` | `null` | callback function when a response is returned
`onAbort` | `null` | callback function which fires anytime an XHR is aborted

You can also set options for all [cy.wait](https://on.cypress.io/api/wait) `requestTimeout` and `responseTimeout` globally in [configuration](https://on.cypress.io/guides/configuration) to control how long to wait for the request and response of a supplied route.

## Yields

## Timeout

# Examples

## Non-stubbed requests

If you do not pass a `response` to a route, Cypress will pass this request through without stubbing it. We can still wait for the request to resolve later.

**Wait on XHR request matching `url`**

```javascript
cy
  .server()
  .route('/users/**').as('getUsers')
  .visit('/users')
  .wait('@getUsers')
```

**Wait on XHR's matching `method` and `url`**

```javascript
cy
  .server()
  .route('POST', /users/).as('postUser')
  .visit('/users')
  .get('#first-name').type('Julius{enter}')
  .wait('@postUser')
```

{% note info Setup route to POST to login %}
[Check out our example recipe using cy.route to POST for login](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js)
{% endnote %}

**Wait on `url` matching glob**

Under the hood Cypress uses [minimatch](https://github.com/isaacs/minimatch) to match glob patterns of `url`.

This means you can take advantage of `*` and `**` support. This makes it *much* easier to route against dynamic segments without having to build up a complex `RegExp`.

We expose [`Cypress.minimatch`](https://on.cypress.io/api/cypress-minimatch) as a function that you can use in your console to test routes.

***Match route against any UserId***

```javascript
// /users/123/comments     <-- matches
// /users/123/comments/465 <-- not matches
cy
  .server()
  .route('/users/*/comments')
```

***Use glob to match all segments***

```javascript
// /posts/1            <-- matches
// /posts/foo/bar/baz  <-- matches
// /posts/quuz?a=b&1=2 <-- matches
cy
  .server()
  .route('/posts/**')
```

**Override `url` glob matching options**

When we check `glob` patterns with [minimatch](https://github.com/isaacs/minimatch), by default we use `{ matchBase: true }`.

You can override these options in [`cy.server`](https://on.cypress.io/api/server) options.

If you'd like to permanently override these options you could do so by setting [`Cypress.Server.defaults(...)`](https://on.cypress.io/api/api-server).

```javascript
cy
  .server({
    urlMatchingOptions: { matchBase: false, dot: true }
  })
  .route(...)
```

## Stubbed requests

If you do pass a `response` to a route, Cypress will stub the response in the request.

**`url` as a string**

When passing a `string` as the `url`, the XHR's URL must match *exactly* what you've written.

```javascript
cy
  .server()
  .route('/users', [{id: 1, name: 'Pat'}])
```

**`url` as a RegExp**

When passing a RegExp as the `url`, the XHR's url will be tested against the regular expression and will apply if it passes.

```javascript
cy
  .server()
  .route(/users\/\d+/, {id: 1, name: 'Phoebe'})
```

```javascript
// Application Code

$.get('/users/1337', function(data){
  console.log(data) // => {id: 1, name: "Phoebe"}
})
```

**Response Functions**

You can also use a function as a response which enables you to add logic surrounding the response.

Functions which return promises will automatically be awaited.

```javascript
var commentsResponse = function(routeData){
  //routeData is a reference to the current route's information

  return {
    data: someOtherFunction(routeData)
  }
}

cy.route('POST', '/comments/**', commentsResponse)
```

**Matching requests and routes**

Any request that matches the `method` and `url` of a route will be responded to based on the configuration of that route.

If a request doesn't match any route, [it will automatically receive a 404](#notes). For example, given we have the following routes:

```javascript
cy
  .server()
  .route(/users/, [
    {id: 19, name: 'Laura'},
    {id: 20, name: 'Jamie'}
  ])
  .route('POST', /messages/, {id: 123, message: 'Hi There!'})
  .get('form').submit()
```

```javascript
// Application Code

// when our form is submitted
$('form').submit(function(){
  // send an AJAX to: GET /users
  $.get('/users' )

  // send an AJAX to: POST /messages
  $.post('/messages', {some: 'data'})

  // send an AJAX to: GET /updates
  $.get('/updates')
})
```

***The above application code will issue 3 AJAX requests:***

1. The `GET /users` will match our 1st route and respond with a `200` status code and the array of users.
2. The `POST /messages` will match our 2nd route and respond with a `200` status code with the message object.
3. The `GET /updates` did not match any routes and its response automatically sent back a `404` status code with an empty response body.

**Specify the method**

The below example matches all `DELETE` requests to "/users" and stubs a response with an empty JSON object.

```javascript
cy
  .server()
  .route('DELETE', '/users', {})
```

## Using Fixtures as Responses

Instead of writing a response inline you can automatically connect a response with a [fixture](https://on.cypress.io/api/fixture).

```javascript
cy
  .server()
  .route('/posts/*', 'fixture:logo.png').as('getLogo')
  .route('/users/*', 'fixture:users/all.json').as('getUsers')
  .route('/admin/*', 'fixtures:users/admin.json').as('getAdmin')
```

You may want to define the `cy.route()` after receiving the fixture and working with it's data.

```javascript
cy
  .fixture('user').then(function(user){
    user.firstName = 'Jane'
    // work with the users array here

    cy.route('GET', 'user/123', user)
  })
  .visit('/users')
  .get('.user').should('include', 'Jane')
```

You can also reference fixtures as strings directly in the response by passing the fixture string with an `@` just like how aliases work.

```javascript
cy
  .fixture('user').as('fxUser')
  .route('POST', '/users/*', '@fxUser')
```

## Options

**Pass in an options object**

```javascript
cy
  .server()
  .route({
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
    onRequest: function(xhr) {
      // do something with the
      // raw XHR object when the
      // request initially goes out
    },
    onResponse: function(xhr) {
      // do something with the
      // raw XHR object when the
      // response comes back
    }
  })
```

**Simulate a server redirect**

Below we simulate the server returning `503` with a stubbed empty JSON response body.

```javascript
cy
  .route({
    method: 'POST',
    url: '/login',
    response: {
      // simulate a redirect to another page
      redirect: '/error'
    }
  })
```

{% note info Setup route to error on POST to login %}
[Check out our example recipe using cy.route to simulate a 503 on POST to login](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js)
{% endnote %}

**Change `headers`**

By default, Cypress will automatically set `Content-Type` and `Content-Length` based on what your `response body` looks like.

If you'd like to override this, explicitly pass in `headers` as an `object literal`.

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

**Using delays for route responses**

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

**Set the routing options by a callback function**

```javascript
cy.route(function(){
  // ...do some custom logic here..

  // and return an appropriate routing object here
  return {
    method: 'POST',
    url: '/users/*/comments',
    response: this.commentsFixture
  }
})
```

**Functions that return promises are awaited**

```javascript
cy.route(function(){
  // a silly example of async return
  return new Cypress.Promise(function(resolve){
    // resolve this promise after 1 second
    setTimeout(function(){
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

**Understanding Stubbed vs Regular XHR's**

Cypress indicates whether an XHR sent back a stubbed response or actually went out to a server in it's Command Log

XHR's that display `(XHR STUB)` in the Command Log have been stubbed and their response, status, headers, and delay have been controlled by your matching `cy.route`.

XHR's that display `(XHR)` in the Command Log have *not* been stubbed and were passed directly through to a server.

![screen shot 2015-12-21 at 7 03 57 pm](https://cloud.githubusercontent.com/assets/1268976/11944790/9b3fe2d8-a816-11e5-9e90-7405555d0c58.png)

Cypress also logs whether the XHR was stubbed or not to the console when you click on the command in the Command Log. It will indicate whether a request was stubbed, which url it matched or that it did not match any routes.

![screen shot 2015-12-21 at 7 22 23 pm](https://cloud.githubusercontent.com/assets/1268976/11945010/0358123a-a819-11e5-9080-f4e0abf8aaa3.png)

Even the `Initiator` is included, which is a stack trace to what caused the XHR to be sent.

**Matching origins and non origin URL's**

When Cypress matches up an outgoing XHR request to a `cy.route`, it actually attempts to match it against both the fully qualified URL and then additionally without the URL's origin.

```javascript
cy.route('/users/*')
```

The following XHR's which were `xhr.open(...)` with these URLs would:

***Match***
- /users/1
- http://localhost:2020/users/2
- https://google.com/users/3

***Not Match***
- /users/4/foo
- http://localhost:2020/users/5/foo

**Requests that don't match any routes**

You can force routes that do not match a route to return `404`:

Status | Body | Headers
--- | --- | ---
`404` | "" | `null`

If you'd like to enable this behavior you need to pass:

```javascript
cy.server({force404: true})
```

You can [read more about this here.](https://on.cypress.io/api/server#prevent-sending-404s-to-unmatched-requests)

# Command Log

```javascript
cy
  .server()
  .route(/accounts/).as('accountsGet')
  .route(/company/, 'fixtures:company').as('companyGet')
  .route(/teams/,   'fixtures:teams').as('teamsGet')
```

Whenever you start a server and add routes, Cypress will display a new Instrument Log called **Routes**. It will list the routing table in the Instrument Log, including the `method`, `url`, `stubbed`, `alias` and number of matched requests:

![screen shot 2015-12-21 at 7 04 41 pm](https://cloud.githubusercontent.com/assets/1268976/11944789/9b3f69b6-a816-11e5-8b8f-bf8a235cf700.png)

When XHR's are made, Cypress will log them in the Command Log and indicate whether they matched a routing alias:

![screen shot 2015-12-21 at 7 19 20 pm](https://cloud.githubusercontent.com/assets/1268976/11944892/ca762cf0-a817-11e5-8713-91ced4a36a8a.png)

When clicking on `XHR Stub` within the Command Log, the console outputs the following:

![screen shot 2015-12-21 at 7 22 23 pm copy](https://cloud.githubusercontent.com/assets/1268976/11944950/711af9e6-a818-11e5-86b6-d17554403355.png)

# See also

- [Guide: Network Requests](https://on.cypress.io/guides/network-requests-xhr)
- [Recipe: Loggin in - XHR Web Form](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js)
- [server](https://on.cypress.io/api/server)
- [wait](https://on.cypress.io/api/wait)
- [as](https://on.cypress.io/api/as)
- [fixture](https://on.cypress.io/api/fixture)
