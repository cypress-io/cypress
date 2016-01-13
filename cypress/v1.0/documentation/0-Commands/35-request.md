slug: request

Use `cy.request` to make XHR requests. Great for talking to an external endpoint before, during, or after your tests for seeding, querying records, or API testing.

`cy.request` always returns the `response` as an object literal.

### [cy.request( *url* )](#url-usage)

Makes a `GET` request to the url.

***

### [cy.request( *method*, *url* )](#method-and-url-usage)

Makes a request using the provided method to the url.

***

### [cy.request( *method*, *url*, *body* )](#method-and-url-and-body-usage)

Additionally pass in the request `body` as a `String` or `Object Literal`. Cypress will automatically set the `Accepts` request header and serialize the response body by its `Content-Type`.

***

### [cy.request( *url*, *body* )](#url-and-body-usage)

Cypress will make a `GET` request to the provided url with the provided body.

***

### [cy.request( *options* )](#options-usage)

You can additionally specify the following options:

Option | Default | Notes
--- | --- | ---
timeout | 20000 | Total time to wait for a response
log | true | Whether to log the request in the Command Log
url | null | The URL to make the request
method | `GET` | The HTTP method to use when making the request
body | null | The Request Body to send along with the request
headers | null | Any additional headers to send. Accepts an object literal.
cookies | false | Whether to send the current browser cookies. Can also accept an object literal.
gzip | true | Whether to accept the `gzip` encoding.
failOnStatus | true | By default Cypress will fail on any response code other than `2xx`.

***

## URL Usage

#### Make a GET request

[block:code]
{
    "codes": [
        {
            "code": "// make a request to seed the database prior to running each test\nbeforeEach(function(){\n  cy.request(\"http://localhost:8080/db/seed\")\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Sets the subject to the XHR's response

[block:code]
{
    "codes": [
        {
            "code": "// the response object is an object literal\n// containing status, body, headers, and duration\ncy.request(\"http://dev.local/users\").then(function(response){\n  // subject is now this response object\n  // {\n  //   status: 200,\n  //   headers: {...},\n  //   body: [{id: 1, name: \"Jane\"}, {id: 2, name: \"LeeAnn\"}],\n  //   duration: 28\n  // {\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Method and URL Usage

#### Send a DELETE request

[block:code]
{
    "codes": [
        {
            "code": "// send a JSON body to create some users\ncy.request(\"DELETE\", \"http://localhost:8888/users\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Method and URL and Body Usage

#### Send a POST request with a JSON body

[block:code]
{
    "codes": [
        {
            "code": "// the Accepts Request Header is automatically set based\n// on the type of body you supply\ncy\n  .request(\"POST\", \"http://localhost:8888/users/admin\", {name: \"Jane\"})\n  .then(function(response){\n    // response.body would automatically be serialized into JSON\n    expect(response.body).to.deep.eq({name: \"Jane\"}) // true\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Notes

#### Why don't I see the XHR in the **Network Tab** of the Chrome Dev Tools?

Cypress does not actually make this request out of the browser. So you will not see the request inside of the Chrome Dev Tools.

***

#### CORS is bypassed

Normally when the browser detects a cross-origin XHR request it will send an `OPTIONS` preflight check to ensure server allows cross-origin requests. `cy.request` bypasses CORS entirely.

[block:code]
{
    "codes": [
        {
            "code": "// we can make requests to any external server, no problem.\ncy\n  .request(\"https://www.google.com/webhp?#q=how+is+cypress+so+awesome\")\n    .its(\"body\")\n    .should(\"include\", \"cypress is awesome because it bypasses CORS\") // true\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Rules for resolving a relative request url

If you provide a non fully qualified domain name Cypress will make its best guess which host you want the request to go to.

[block:code]
{
    "codes": [
        {
            "code": "cy\n  // after you visit somewhere Cypress will assume this is the host\n  .visit(\"http://localhost:8080/app\")\n  .request(\"users/1.json\") // <-- url is http://localhost:8080/users/1.json\n",
            "language": "js"
        }
    ]
}
[/block]

If you make the `cy.request` prior to visiting a page, Cypress will use the host configured in the `baseUrl` property inside of `cypress.json`.

[block:code]
{
    "codes": [
        {
            "code": "// cypress.json\n{\n  baseUrl: \"http://localhost:1234\"\n}\n",
            "language": "js"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// inside of your tests\ncy.request(\"seed/admin\") //<-- url is http://localhost:1234/seed/admin\n",
            "language": "js"
        }
    ]
}
[/block]

If Cypress cannot determine the host it will throw an explicit error.

***

## Related
1. [server](server)