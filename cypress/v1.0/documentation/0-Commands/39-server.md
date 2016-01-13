slug: server

#### **New to Cypress?** [Read about XHR strategy first.](xhr)

***

Use `cy.server` to control the behavior of requests and responses.

### [cy.server()](#default-usage)

Start a server to begin routing responses to your requests.

***

### [cy.server( *options* )](#options-usage)

`cy.server` takes options that are used for 2 different purposes:

1. As defaults which are merged into `cy.route`
2. As configuration behavior for all requests

The following options will automatically be merged in as defaults for `cy.route`

Option | Default | Notes
--- | --- | ---
delay | 0 | Default delay for responses
method | GET | Default method to match against requests
status | 200 | Default response Status code
headers | null | Default response Headers
response | null | Default response Body
onRequest | null | Default callback function when a request is sent
onResponse | null | Default callback function when a response is returned

And these options control the behavior of the server affecting all requests.

Option | Default | Notes
--- | --- | ---
enable | true | Pass `false` to disable existing route stubs
force404 | true | Forces requests which don't match your routes to be sent back `404`.
whitelist | function | Default callback function which whitelists requests from ever being logged or stubbed. By default this matches against asset-like requests such as `.js`, `.jsx`, `.html`, `.css`, etc

***

## Default Usage

#### Start a server

[block:code]
{
    "codes": [
        {
            "code": "cy.server()\n",
            "language": "js"
        }
    ]
}
[/block]

By default after starting a server:
- Any request which does not match a `cy.route` will be sent `404`
- Any request that matches the `options.whitelist` function will **NOT** be logged or stubbed. In other words it is "whitelisted" and ignored.
- You will see requests named as `XHR Stub` in the Command Log.

***

## Options Usage

#### Change the defaults for upcoming `cy.route` commands

By default `cy.route` inherits its options from `cy.server`. Passing any of the following options will be inherited:

- delay
- method
- status
- headers
- response
- onRequest
- onResponse

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server({\n    method: \"POST\",\n    delay: 1000,\n    status: 422,\n    response: {}\n  })\n\n  // our route command will now inherit its options\n  // from the server. anything we pass specifically\n  // will override the defaults.\n  //\n  // in this example our matching requests will\n  // be delayed 1000ms and have a status of 422\n  // but its response be what we set below\n  .route(/users/, {errors: \"Name cannot be blank\"})\n\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Change the default delay for all routes

[block:code]
{
    "codes": [
        {
            "code": "// delay each response 1500ms\ncy.server({delay: 1500})\n",
            "language": "js"
        }
    ]
}
[/block]

Adding delay helps simulate real world network latency. Normally stubbed responses return in under <20ms. Adding a delay can help you visualize how your application's state reacts to requests that are in flight.

***

#### Prevent sending 404's to unmatched requests

By default, once you start a `server` Cypress will automatically send requests that don't match routes the following:

Status | Body | Headers
--- | --- | ---
404 | "" | null

If you'd like to disable this behavior and enable requests which do NOT match your routes to continue to reach your server, then pass `{force404: false}`.

[block:code]
{
    "codes": [
        {
            "code": "// Test Code\n\ncy\n  .server({force404: false})\n  .route(/activities/, \"fixture:activities.json\")\n",
            "language": "js"
        }
    ]
}
[/block]

```js
// Application Code

$(function(){
  // sent back activities.json response fixture
  $.get("/activities")

  // normally this would be sent back 404
  // since it does not match any of your
  // cy.routes - but by turning off `force404`
  // it will not be stubbed and will hit your
  // server like normal
  $.getJSON("/users.json")
})
```

![screen shot 2015-12-21 at 7 38 13 pm](https://cloud.githubusercontent.com/assets/1268976/11945137/73afe840-a81a-11e5-8290-ef62ef6f62e6.png)

***

#### Change the default response headers for all routes

When you stub requests, you can automatically control their response headers.

> **Note:** Cypress automatically sets `Content-Length` and `Content-Type` based on the response body you've stubbed

This is useful when you want to send back meta data in the headers, such as **pagination** or **token** information.

[block:code]
{
    "codes": [
        {
            "code": "// Test Code\n\ncy\n  .server({\n    headers: {\n      \"x-token\": \"abc-123-foo-bar\"\n    }\n  })\n  .route(\"GET\", \"/users/1\", {id: 1, name: \"Brian\"}).as(\"getUser\")\n  .visit(\"/users/1/profile\")\n  .wait(\"@getUser\")\n    .its(\"responseHeaders\")\n    .should(\"have.property\", \"x-token\", \"abc-123-foo-bar\") // true\n",
            "language": "js"
        }
    ]
}
[/block]

[block:code]
{
    "codes": [
        {
            "code": "// Application Code\n\n// lets use the native XHR object\nvar xhr = new XMLHttpRequest\n\nxhr.open(\"GET\", \"/users/1\")\n\nxhr.onload = function(){\n  var token = this.getResponseHeader(\"x-token\")\n  console.log(token) // => abc-123-foo-bar\n}\n\nxhr.send()\n\n",
            "language": "js"
        }
    ]
}
[/block]

***

#### Change the default whitelisting

By default Cypress comes with a `whitelist` function which will filter out any requests which are for static assets like `.html`, `.js`, `.jsx`, `.css`.

Any request that passes the `whitelist` will be ignored - it will not be logged nor will it be stubbed in any way (even if it matches a specific `cy.route`).

The idea is that we never went to interfere with static assets which are fetched via AJAX.

The default function is:

[block:code]
{
    "codes": [
        {
            "code": "var whitelist = function(xhr){\n  // this function receives the xhr object in question and\n  // will whitelist if its a GET that appears to be a static resource\n  xhr.method === \"GET\" && /\\.(jsx?|html|css)(\\?.*)?$/.test(xhr.url)\n}\n",
            "language": "js"
        }
    ]
}
[/block]

You can of course override this function with your own specific logic.

[block:code]
{
    "codes": [
        {
            "code": "cy.server({\n  whitelist: function(xhr){\n    // specify your own function that should return\n    // truthy if you want this xhr to be ignored,\n    // not logged, and not stubbed.\n  }\n})\n",
            "language": "js"
        }
    ]
}
[/block]

If you would like to change the default option for **ALL** `cy.server` you [can change this option permanently](#permanently-override-default-server-options).

***

#### Turn off the server after you've started it

You can disable all stubbing and its effects and restore to the default behavior as a test is running.

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route(\"POST\", /users/, {}).as(\"createUser\")\n\n  ...\n\n  // this now disables stubbing routes and XHR's\n  // will no longer show up as (XHR Stub) in the\n  // Command Log. However routing aliases can\n  // continue to be used and will continue to\n  // match requests, but will not affect responses\n  .server({enable: false})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Notes

#### Permanently override default server options

Any configuration you pass to `cy.server` will only persist until the end of the test. If you find yourself passing the same configuration to each `cy.server`, then you might want to permanently change the default options for all `cy.server` instances.

> **Note:** A great place to put this configuration is in your `tests/_support/spec_helper.js` file, since it is loaded before any test files are evaluated.

[block:code]
{
    "codes": [
        {
            "code": "// pass anything here you'd normally pass\n// to cy.server(). These options will now\n// because the new defaults.\nCypress.Server.defaults({\n  delay: 500,\n  force404: false,\n  whitelist: function(xhr){\n    // handle custom logic for whitelisting\n  }\n})\n",
            "language": "js"
        }
    ]
}
[/block]

These are now the default options for any `cy.server`.

***

#### Server persists until the next test runs

Cypress automatically continues to persist server + routing configuration even after a test ends. This means you can continue to use your application and still benefit from stubbing or other server configuration.

However between tests, when a new test runs, the previous configuration is restored to a clean state. No configuration will leak between tests.

***

#### Outstanding requests are automatically aborted between tests

When a new test runs, any oustanding requests still in flight are automatically aborted. In fact this happens by default whether or not you've even started a `cy.server`.

***

#### Server can be started before you `cy.visit`

Oftentimes your application may make initial requests immediately when it loads (such as authenticating a user). Cypress makes it possible to actually start your server and define routes before a `cy.visit`. Upon the next visit, the server + routes will be instantly applied before your application loads.

You can [read more about XHR strategy here](xhr).

***

## Related
1. [route](route)
2. [wait](wait)
3. [get](get)
4. [as](as)
5. [request](request)