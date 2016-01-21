slug: request
excerpt: Make XHR request

# [cy.request( *url* )](#url-usage)

Makes a `GET` request using the url.

Use `cy.request` to make XHR requests. Great for talking to an external endpoint before, during, or after your tests for seeding, querying records, or API testing.

`cy.request` always returns the `response` as an object literal.

***

# [cy.request( *method*, *url* )](#method-and-url-usage)

Make a request using the provided method to the url.

***

# [cy.request( *method*, *url*, *body* )](#method-and-url-and-body-usage)

Additionally pass in the request `body` as a `String` or `Object Literal`. Cypress will set the `Accepts` request header and serialize the response body by its `Content-Type`.

***

# [cy.request( *url*, *body* )](#url-and-body-usage)

Make a `GET` request to the provided url with the provided body.

***

# Options

Pass in an options object to change the default behavior of the command.

**[cy.request( *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`method` | `GET` | The HTTP method to use when making the request.
`url` | `null` | The URL to make the request.
`body` | `null` | The Request Body to send along with the request.
`headers` | `null` | Any additional headers to send. Accepts an object literal.
`cookies` | `false` | Whether to send the current browser cookies. Can also accept an object literal.
`gzip` | `true` | Whether to accept the `gzip` encoding.
`failOnStatus` | `true` | Whether to fail on response codes other than `2xx`.
`timeout` | `20000` | Total time to wait for a response (in ms)
`log` | `true` | Whether to log the request in the Command Log

You can also set options for the `cy.request`'s `baseUrl` and `responseTimeout` globally in [configuration](https://on.cypress.io/guides/configuration).

***

# URL Usage

## Make a `GET` request

```javascript
// make a request to seed the database prior to running each test
beforeEach(function(){
  cy.request("http://localhost:8080/db/seed")
})
```

***

## Send the new subject to an XHR's response on request

```javascript
// the response object is an object literal
// containing status, body, headers, and duration
cy.request("http://dev.local/users").then(function(response){
  // subject is now the response object
  // {
  //   status: 200,
  //   headers: {...},
  //   body: [{id: 1, name: "Jane"}, {id: 2, name: "LeeAnn"}],
  //   duration: 28
  // }
})
```

***

# Method and URL Usage

## Send a `DELETE` request

```javascript
// Delete a user
cy.request("DELETE", "http://localhost:8888/users/827")
```

***

# Method and URL and Body Usage

## Send a `POST` request with a JSON body

```javascript
// the Accepts Request Header is automatically set based
// on the type of body you supply
cy
  .request("POST", "http://localhost:8888/users/admin", {name: "Jane"})
  .then(function(response){
    // response.body would automatically be serialized into JSON
    expect(response.body).to.have.property("name", "Jane") // true
})
```

***

# Notes

## Why don't I see the XHR in the Network Tab of the Chrome Dev Tools?

Cypress does not actually make the request out of the browser. So you will not see the request inside of the Chrome Dev Tools.

***

## CORS is bypassed

Normally when the browser detects a cross-origin XHR request, it will send an `OPTIONS` preflight check to ensure the server allows cross-origin requests. `cy.request` bypasses CORS entirely.

```javascript
// we can make requests to any external server, no problem.
cy
  .request("https://www.google.com/webhp?#q=cypress.io+cors")
    .its("body")
    .should("include", "Testing, the way it should be") // true
```

***

## Rules for resolving a relative request url

If you provide a non fully qualified domain name (FQDN), Cypress will make its best guess as to which host you want the request to go to.

```javascript
cy
  // after you visit somewhere, Cypress will assume this is the host
  .visit("http://localhost:8080/app")
  .request("users/1.json") // <-- url is http://localhost:8080/users/1.json
```

If you make the `cy.request` prior to visiting a page, Cypress will use the host configured as the `baseUrl` property inside of `cypress.json`.

```javascript
// cypress.json
{
  baseUrl: "http://localhost:1234"
}
```

```javascript
// inside of your tests
cy.request("seed/admin") //<-- url is http://localhost:1234/seed/admin
```

If Cypress cannot determine the host it will throw an explicit error.

***

# Related

- [visit](https://on.cypress.io/api/visit)