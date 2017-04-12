slug: request
excerpt: Make HTTP request

Use `cy.request` to make HTTP requests. Great for talking to an external endpoint before, during, or after your tests for seeding, querying records, or API testing.

| | |
|--- | --- |
| **Returns** | the `response` as an object literal. |
| **Timeout** | `cy.request` will wait for the response for the duration of the [responseTimeout](https://on.cypress.io/guides/configuration#timeouts) or the [`timeout`](#options) passed in the options object of the command. |

***

# [cy.request( *url* )](#url-usage)

Makes a `GET` request using the specified url.

***

# [cy.request( *url*, *body* )](#url-and-body-usage)

Make a `GET` request to the provided url with the provided body.

***

# [cy.request( *method*, *url* )](#method-and-url-usage)

Make a request using the provided method to the specified url.

***

# [cy.request( *method*, *url*, *body* )](#method-and-url-and-body-usage)

Additionally pass in the request `body` as a `String` or `Object Literal`. Cypress will set the `Accepts` request header and serialize the response body by its `Content-Type`.

***

# Options

Pass in an options object to change the default behavior of `cy.request`.

**[cy.request( *options* )](#options-usage)**

Option | Default | Notes
--- | --- | ---
`auth` | `null` | Any auth to send. Accepts an object literal.
`body` | `null` | The Request Body to send along with the request.
`failOnStatusCode` | `true` | Whether to fail on response codes other than `2xx` and `3xx`.
`followRedirect` | `true` | Whether to automatically follow redirects.
`form` | `false` | Whether to convert the `body` values to urlencoded content and automatically set the `x-www-form-urlencoded` header.
`gzip` | `true` | Whether to accept the `gzip` encoding.
`headers` | `null` | Any additional headers to send. Accepts an object literal.
`log` | `true` | Whether to log the request in the Command Log
`method` | `GET` | The HTTP method to use when making the request.
`qs` | `null` | The query parameters to be appended to the `url` option when making the request.
`timeout` | [`responseTimeout`](https://on.cypress.io/guides/configuration#timeouts) | Total time to wait for a response (in ms)
`url` | `null` | The URL to make the request.

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

## Issue a simple HTTP request

```javascript
cy
  // dont visit this page and load the resources
  // instead let's just issue a simple HTTP request
  // so we can make an assertion about its body
  .request("/admin")
  .its("body")
  .should("include", "<h2>admin.html</h2>")
```

***

## Send the new subject to an HTTP's response on request

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

# Options Usage

## Request the dashboard while disabling auto redirect

```javascript
// to test the redirection behavior on login without a session
// cy.request can be used to check the status code and redirectedToUrl property.
//
// the 'redirectedToUrl' property is a special Cypress property under the hood
// that normalizes the url the browser would normally follow during a redirect

cy.request({
  url: '/dashboard',
  followRedirect: false // turn off following redirects automatically
})
.then((resp) => {
  // should have status code 302
  expect(resp.status).to.eq(302)

  // when we turn off following redirects, Cypress will also send us
  // a 'redirectedToUrl' property with the fully qualified URL that we were redirected to.
  expect(resp.redirectedToUrl).to.eq("http://localhost:8082/unauthorized")
})
```

***

## HTML form submissions using form option

```javascript
// oftentimes once we have a proper e2e test around logging in
// there is NO more reason to actually use our UI to log in users
// doing so wastes a huge amount of time, as our entire page has to load
// all associated resources, we have to wait to fill the
// form and for the form submission and redirection process
//
// with cy.request we can bypass all of this because it automatically gets
// and sets cookies under the hood which acts exactly as if these requests
// came from the browser

cy
  .request({
    method: 'POST',
    url: '/login_with_form', // baseUrl will be prepended to this url
    form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
    body: {
      username: 'jane.lane',
      password: 'password123'
    }
  })

  // just to prove we have a session
  cy.getCookie("cypress-session-cookie").should('exist')
```

[block:callout]
{
  "type": "info",
  "body": "[Check out our example recipe using cy.request for HTML form submissions](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_html_web_form_spec.js)",
  "title": "Using cy.request for HTML Forms"
}
[/block]

***

# Notes

## Why don't I see the XHR in the Network Tab of the Chrome Dev Tools?

Cypress does not actually make an XHR request out of the browser. Under the hood we are making the HTTP request from the desktop application (in node). Therefore you will not see the request inside of the Chrome Dev Tools.

Note that we automatically set both Cookies + User Agent headers correctly as if the request was really coming from the browser.

***

## CORS is bypassed

Normally when the browser detects a cross-origin HTTP request, it will send an `OPTIONS` preflight check to ensure the server allows cross-origin requests. `cy.request` bypasses CORS entirely.

```javascript
// we can make requests to any external server, no problem.
cy
  .request("https://www.google.com/webhp?#q=cypress.io+cors")
    .its("body")
    .should("include", "Testing, the way it should be") // true
```

***

## Cookies are automatically sent and received

Before sending the HTTP request, we will automatically attach cookies that would have otherwise been attached had the request come from the browser. Additionally, if a response has a `Set-Cookie` header, these are automatically set back on the browser cookies.

In other words, `cy.request` transparently performs all of the underlying functions as if it came from the browser.

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

- [Recipe: Logging In - HTML Web Form](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_html_web_form_spec.js)
- [Recipe: Logging In - XHR Web Form](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js)
- [Recipe: Logging In - CSRF Tokens](https://github.com/cypress-io/cypress-example-recipes#logging-in---csrf-tokens)
- [Recipe: Logging In - Single Sign on](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js)
- [visit](https://on.cypress.io/api/visit)
