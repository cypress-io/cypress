slug: route

#### **New to Cypress?** [Read about XHR strategy first.](xhr)

***

Use `cy.route` to route responses to matching requests.

### [cy.route( *url* )](#url-usage)

Set a route matching the specific `url` which is not stubbed but can be waited on later.

***

### [cy.route( *method*, *url* )](#method-and-url-usage)

Set a route matching the specific `method` and `url` which is not stubbed but can be waited on later.

***

### [cy.route( *url*, *response* )](#url-and-response-usage)

Set a route matching the `url` stubbed with the supplied `response`.

By default this will match `GET` request methods.

***

### [cy.route( *method*, *url*, *response* )](#method-url-and-response-usage)

Set a route matching the `method` and `url` stubbed with the supplied `response`.

***

### [cy.route( *options* )](#options-usage)

Pass in an object containing the following key/values.

Option | Default | Notes
--- | --- | ---
method | GET | method to match against requests
url    | null | string or regexp url to match against request urls
response | null | response body when stubbing roues
status | 200 | response status code when stubbing routes
delay | 0 | delay for stubbed responses
headers | null | response headers for stubbed routes
onRequest | null | callback function when a request is sent
onResponse | null | callback function when a response is returned

***

## Url Usage

#### Wait on non-stubbed XHR's by url

[block:code]
{
    "codes": [
        {
            "code": "// by not passing a response to the route\n// Cypress will pass this request through\n// without stubbing it - but still allow\n// us to wait for it later\ncy\n  .server()\n  .route(/users/).as(\"getUsers\")\n  .visit(\"/users\")\n  .wait(\"@getUsers\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Method and Url Usage

#### Wait on non-stubbed XHR's by method + url

[block:code]
{
    "codes": [
        {
            "code": "// by not passing a response to the route\n// Cypress will pass this request through\n// without stubbing it - but still allow\n// us to wait for it later\ncy\n  .server()\n  .route(\"POST\", /users/).as(\"postUser\")\n  .visit(\"/users\")\n  .get(\"#first-name\").type(\"Brian{enter}\")\n  .wait(\"@postUser\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Url and Response Usage

#### Url as a string

When passing a `string` as the `url`, the XHR's URL must match exactly what you've written.

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route(\"/users\", [{id: 1, name: \"Brian\"}])\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Url as a regexp

When passing a `regexp` as the `url`, the XHR's url will be tested against this regular expression and will apply if it passes.

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route(/users\\/\\d+/, {id: 1, name: \"Randall\"})\n",
            "language": "js"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// Application Code\n\n$.get(\"/users/1337\", function(data){\n  console.log(data) // => {id: 1, name: \"Randall\"}\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Matching requests and routes

Any request that matches the `method` and `url` of a route will be responded to based on the configuration of that route.

If a request doesn't match any route [it will automatically receive a 404](#notes).

For instance given we have the following routes:

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route(/users/, [{id: 19, name: \"Laura\"}, {id: 20, name: \"Jamie\"}])\n  .route(\"POST\", /messages/, {id: 123, message: \"foobarbaz!\"})\n  .get(\"form\").submit()\n",
            "language": "js"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// Application Code\n\n// when our form is submitted\n$(\"form\").submit(function(){\n  // send an AJAX to: GET /users\n  $.get(\"/users\" )\n\n  // send an AJAX to: POST /messages\n  $.post(\"/messages\", {some: \"data\"})\n\n  // send an AJAX to: GET /updates\n  $.get(\"/updates\")\n})\n",
            "language": "js"
        }
    ]
}
[/block]

The above application code will issue **3** AJAX requests.

1. The `GET /users` will match our 1st route, it will respond with 200 and the array of users.
2. The `POST /messages` will match our 2nd route, it will respond with 200 with the message object.
3. The `GET /updates` did not match any routes, and its response automatically sent back a **404** with an empty response body.

***

## Method, Url, and Response Usage

#### Specify the method

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n\n  // match all DELETE requests to \"/users\"\n  // and respond with an empty JSON object\n  .route(\"DELETE\", \"/users\", {})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Options Usage

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route({\n    method: \"DELETE\",\n    url: /user\\/\\d+/,\n    status: 412,\n    response: {\n      rolesCount: 45\n    },\n    delay: 500,\n    headers: {\n      \"X-Token\": null\n    },\n    onRequest: function(xhr) {\n      // do something with the\n      // raw XHR object when the\n      // request initially goes out\n    },\n    onResponse: function(xhr) {\n      // do something with the\n      // raw XHR object when the\n      // response comes back\n    }\n  })\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Setting a delay for a specific route

You can optionally pass in a delay option which will cause a delay (in ms) to the response for matched requests. The example below will cause the response to be delayed by 3 secs.

[block:code]
{
    "codes": [
        {
            "code": "cy.route({\n  method: \"PATCH\",\n  url: /answers\\/\\d+/,\n  response: {},\n  delay: 3000\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Notes

#### Understanding Stubbed vs Regular XHR's

Cypress indicates whether an XHR was sent back a stubbed response vs actually going out to your server.

XHR's which indicate `(XHR STUB)` have been stubbed and their response, status, headers, and delay have been controlled by your matching `cy.route`.

XHR's which indicate `(XHR)` have not been stubbed and were passed directly through to your server.

![screen shot 2015-12-21 at 7 03 57 pm](https://cloud.githubusercontent.com/assets/1268976/11944790/9b3fe2d8-a816-11e5-9e90-7405555d0c58.png)

Additionally Cypress logs this to the console when you click on the command log. It will indicate whether a request was stubbed, which url it matched, or that it did not match any routes.

![screen shot 2015-12-21 at 7 22 23 pm](https://cloud.githubusercontent.com/assets/1268976/11945010/0358123a-a819-11e5-9080-f4e0abf8aaa3.png)

Even the `Initiator` is included which is a stack trace of what caused the XHR to be sent.

***

#### Requests which don't match a route

By default, **all** requests which do not match a route will automatically be handed back:

Status | Body | Headers
--- | --- | ---
404 | "" | null

If you'd like to disable this behavior you need to pass:

[block:code]
{
    "codes": [
        {
            "code": "cy.server({force404: false})\n",
            "language": "js"
        }
    ]
}
[/block]

You can [read more about this here.](server#prevent-sending-404s-to-unmatched-requests)

***

#### Using Fixtures as Responses

Instead of writing a response inline you can automatically connect a response with a fixture.

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route(/posts/, \"fixture:logo.png\").as(\"getLogo\")\n  .route(/users/, \"fixture:users/all.json\").as(\"getUsers\")\n  .route(/admin/, \"fixtures:users/admin.json\").as(\"getAdmin\")\n",
            "language": "js"
        }
    ]
}
[/block]

You can [read more about fixtures here.](https://github.com/cypress-io/cypress/wiki/fixture#usage-with-cyroute)

***

#### Response Headers are automatically set

By default, Cypress will automatically set `Content-Type` and `Content-Length` based on what your `response body` looks like.

If you'd like to override this, explicitly pass in `headers` as an `object literal`.

***

## Command Log

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route(/accounts/).as(\"accountsGet\")\n  .route(/company/, \"fixtures:company\").as(\"companyGet\")\n  .route(/teams/,   \"fixtures:teams\").as(\"teamsGet\")\n",
            "language": "js"
        }
    ]
}
[/block]

Whenever you start a server and add routes, Cypress will display a new `Instrument Log` called **Routes**.

It will list the routing table in this, including the `method`, `url`, `stubbed`, `alias`, and number of matched requests:

![screen shot 2015-12-21 at 7 04 41 pm](https://cloud.githubusercontent.com/assets/1268976/11944789/9b3f69b6-a816-11e5-8b8f-bf8a235cf700.png)

When XHR's are made Cypress will log them and indicate whether they matched a routing alias:

![screen shot 2015-12-21 at 7 19 20 pm](https://cloud.githubusercontent.com/assets/1268976/11944892/ca762cf0-a817-11e5-8713-91ced4a36a8a.png)

When clicking on `XHR Stub` within the command log, the console outputs the following:

![screen shot 2015-12-21 at 7 22 23 pm copy](https://cloud.githubusercontent.com/assets/1268976/11944950/711af9e6-a818-11e5-86b6-d17554403355.png)

***
## Related
1. [server](server)
2. [wait](wait)
3. [as](as)