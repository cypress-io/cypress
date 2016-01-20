slug: route
excerpt: Route responses to matching requests

## [cy.route( *url* )](#url-usage)

Use `cy.route` to route responses to matching requests.

Set a route matching the specific `url` which is not stubbed but can be waited on later.

[block:callout]
{
  "type": "info",
  "body": "[Read about XHR strategy first.](http://on.cypress.io/guides/network-requests-xhr)",
  "title": "New to Cypess?"
}
[/block]

***

## [cy.route( *method*, *url* )](#method-and-url-usage)

Set a route matching the specific `method` and `url` which is not stubbed but can be waited on later.

***

## [cy.route( *url*, *response* )](#url-and-response-usage)

Set a route matching the `url` stubbed with the supplied `response`.

By default this will match `GET` request methods.

***

## [cy.route( *method*, *url*, *response* )](#method-url-and-response-usage)

Set a route matching the `method` and `url` stubbed with the supplied `response`.

***

## [cy.route( *options* )](#options-usage)

Pass in an object containing the following key/values.

Option | Default | Notes
--- | --- | ---
`method` | `GET` | method to match against requests
`url`    | `null` | string or RegExp url to match against request urls
`response` | `null` | response body when stubbing routes
`status` | `200` | response status code when stubbing routes
`delay` | `0` | delay for stubbed responses (in ms)
`headers` | `null` | response headers for stubbed routes
`onRequest` | `null` | callback function when a request is sent
`onResponse` | `null` | callback function when a response is returned

***

## Url Usage

Wait on non-stubbed XHR's by url

```javascript
// by not passing a response to the route
// Cypress will pass this request through
// without stubbing it - but still allow
// us to wait for it later
cy
  .server()
  .route(/users/).as("getUsers")
  .visit("/users")
  .wait("@getUsers")
```

***

## Method and Url Usage

Wait on non-stubbed XHR's by method + url

```javascript
// by not passing a response to the route
// Cypress will pass this request through
// without stubbing it - but still allow
// us to wait for it later
cy
  .server()
  .route("POST", /users/).as("postUser")
  .visit("/users")
  .get("#first-name").type("Julius{enter}")
  .wait("@postUser")
```

***

## Url and Response Usage

**Url as a string**

When passing a `string` as the `url`, the XHR's URL must match exactly what you've written.

```javascript
cy
  .server()
  .route("/users", [{id: 1, name: "Pat"}])
```

***

**Url as a RegExp**

When passing a RegExp as the `url`, the XHR's url will be tested against the regular expression and will apply if it passes.

```javascript
cy
  .server()
  .route(/users\/\d+/, {id: 1, name: "Phoebe"})
```

```javascript
// Application Code

$.get("/users/1337", function(data){
  console.log(data) // => {id: 1, name: "Phoebe"}
})
```

***

**Matching requests and routes**

Any request that matches the `method` and `url` of a route will be responded to based on the configuration of that route.

If a request doesn't match any route [it will automatically receive a 404](#notes).

For instance given we have the following routes:

```javascript
cy
  .server()
  .route(/users/, [{id: 19, name: "Laura"}, {id: 20, name: "Jamie"}])
  .route("POST", /messages/, {id: 123, message: "Hi There!"})
  .get("form").submit()
```

```javascript
// Application Code

// when our form is submitted
$("form").submit(function(){
  // send an AJAX to: GET /users
  $.get("/users" )

  // send an AJAX to: POST /messages
  $.post("/messages", {some: "data"})

  // send an AJAX to: GET /updates
  $.get("/updates")
})
```

The above application code will issue 3 AJAX requests:

1. The `GET /users` will match our 1st route and respond with a 200 status code and the array of users.
2. The `POST /messages` will match our 2nd route and respond with a 200 status code with the message object.
3. The `GET /updates` did not match any routes and its response automatically sent back a 404 status code with an empty response body.

***

## Method, Url, and Response Usage

Specify the method

```javascript
cy
  .server()

  // match all DELETE requests to "/users"
  // and respond with an empty JSON object
  .route("DELETE", "/users", {})
```

***

## Options Usage

```javascript
cy
  .server()
  .route({
    method: "DELETE",
    url: /user\/\d+/,
    status: 412,
    response: {
      rolesCount: 2
    },
    delay: 500,
    headers: {
      "X-Token": null
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

***

**Setting a delay for a specific route**

You can optionally pass in a delay option which will cause a delay (in ms) to the response for matched requests. The example below will cause the response to be delayed by 3 secs.

```javascript
cy.route({
  method: "PATCH",
  url: /activities\/\d+/,
  response: {},
  delay: 3000
})
```

***

## Notes

**Understanding Stubbed vs Regular XHR's**

Cypress indicates whether an XHR sent back a stubbed response vs actually going out to a server.

XHR's that indicate `(XHR STUB)` in the Command Log have been stubbed and their response, status, headers, and delay have been controlled by your matching `cy.route`.

XHR's that indicate `(XHR)` in the Command Log have not been stubbed and were passed directly through to a server.

![screen shot 2015-12-21 at 7 03 57 pm](https://cloud.githubusercontent.com/assets/1268976/11944790/9b3fe2d8-a816-11e5-9e90-7405555d0c58.png)

Cypress also logs whether the XHR was stubbed or not to the console when you click on the command in the Command Log. It will indicate whether a request was stubbed, which url it matched or that it did not match any routes.

![screen shot 2015-12-21 at 7 22 23 pm](https://cloud.githubusercontent.com/assets/1268976/11945010/0358123a-a819-11e5-9080-f4e0abf8aaa3.png)

Even the `Initiator` is included, which is a stack trace to what caused the XHR to be sent.

***

**Requests that don't match a route**

By default, **all** requests that do not match a route will automatically be handed back:

Status | Body | Headers
--- | --- | ---
`404` | "" | `null`

If you'd like to disable this behavior you need to pass:

```javascript
cy.server({force404: false})
```

You can [read more about this here.](http://on.cypress.io/api/server#prevent-sending-404s-to-unmatched-requests)

***

**Using Fixtures as Responses**

Instead of writing a response inline you can automatically connect a response with a fixture.

```javascript
cy
  .server()
  .route(/posts/, "fixture:logo.png").as("getLogo")
  .route(/users/, "fixture:users/all.json").as("getUsers")
  .route(/admin/, "fixtures:users/admin.json").as("getAdmin")
```

```javascript
cy
  .fixture("users").then(function(json){
    cy.route("GET", /users/, json)
  })
```

You can [read more about fixtures here.](http://on.cypress.io/api/fixture)

***

**Response Headers are automatically set**

By default, Cypress will automatically set `Content-Type` and `Content-Length` based on what your `response body` looks like.

If you'd like to override this, explicitly pass in `headers` as an `object literal`.

***

## Command Log

```javascript
cy
  .server()
  .route(/accounts/).as("accountsGet")
  .route(/company/, "fixtures:company").as("companyGet")
  .route(/teams/,   "fixtures:teams").as("teamsGet")
```

Whenever you start a server and add routes, Cypress will display a new Instrument Log called **Routes**.

It will list the routing table in the Instrument Log, including the `method`, `url`, `stubbed`, `alias` and number of matched requests:

![screen shot 2015-12-21 at 7 04 41 pm](https://cloud.githubusercontent.com/assets/1268976/11944789/9b3f69b6-a816-11e5-8b8f-bf8a235cf700.png)

When XHR's are made, Cypress will log them in the Command Log and indicate whether they matched a routing alias:

![screen shot 2015-12-21 at 7 19 20 pm](https://cloud.githubusercontent.com/assets/1268976/11944892/ca762cf0-a817-11e5-8713-91ced4a36a8a.png)

When clicking on `XHR Stub` within the Command Log, the console outputs the following:

![screen shot 2015-12-21 at 7 22 23 pm copy](https://cloud.githubusercontent.com/assets/1268976/11944950/711af9e6-a818-11e5-86b6-d17554403355.png)

***

## Related
1. [server](http://on.cypress.io/api/server)
2. [wait](http://on.cypress.io/api/wait)
3. [as](http://on.cypress.io/api/as)
4. [Network Requests](http://on.cypress.io/guides/network-requests-xhr)