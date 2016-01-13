slug: visit

### [cy.visit( *url* )](#usage)

Visit a remote url. This will most likely be the first command you run.

`cy.visit(...)` resolves when the remote page fires its `load` event.

***

### [cy.visit( *url*, *options* )](#options-usage)

Visit optionally accepts an `options` object:
 - `timeout`      **Default:** 20000ms
 - `onBeforeLoad` **Default:** function(){}
 - `onLoad`       **Default:** function(){}

***

## Usage

> Visit a local server running on http://localhost:8000

[block:code]
{
    "codes": [
        {
            "code": "cy.visit(\"http://localhost:8000\")\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Protocol can be omitted from common hosts

[block:code]
{
    "codes": [
        {
            "code": "// cypress will automatically prepend the http:// protocol\n// to common hosts.  If you're not using one of these\n// 3 hosts, then make sure to provide the protocol\ncy.visit(\"localhost:3000\") // => http://localhost:3000\ncy.visit(\"0.0.0.0:3000\")   // => http://0.0.0.0:3000\ncy.visit(\"127.0.0.1:3000\") // => http://127.0.0.1:3000\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Cypress can optionally act as your web server

[block:code]
{
    "codes": [
        {
            "code": "// Cypress will automatically attempt to serve your files\n// if you do not provide a host. The path should be relative\n// to your project's root folder. The root folder is\n// where cypress.json is stored.\ncy.visit(\"app/index.html\")\n",
            "language": "js"
        }
    ]
}
[/block]

Having Cypress serve your files is useful in simple projects and example apps, but isn't recommended for real apps.  It is always better to run your own server and provide the url to Cypress.

***

> Visit is automatically prefixed with `baseUrl`

[block:code]
{
    "codes": [
        {
            "code": "// cypress.json\n{\n  baseUrl: \"http://localhost:3000/#/\"\n}\n\n// this will visit the complete url\n// http://localhost:3000/#/dashboard\ncy.visit(\"dashboard\")\n",
            "language": "js"
        }
    ]
}
[/block]

This is highly recommended. Simply configure `baseUrl` in the `cypress.json` file to prevent repeating yourself in every single `cy.visit(...)`.

Read more about [`configuration`](getting-started#configuration) here.

***

## Options Usage

> Change the default timeout

[block:code]
{
    "codes": [
        {
            "code": "// change the timeout to be 30 seconds\ncy.visit(\"/index.html\", {timeout: 30000})\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Provide an `onBeforeLoad` callback function

[block:code]
{
    "codes": [
        {
            "code": "// onBeforeLoad is called as soon as possible, before\n// your page has loaded all of its resources.  Your scripts\n// will not be ready at this point, but it's a great hook\n// to potentially manipulate the page.\ncy.visit(\"http://localhost:3000/#dashboard\", {\n  onBeforeLoad: function(contentWindow){\n    // contentWindow is the remote page's window object\n  }\n})\n",
            "language": "js"
        }
    ]
}
[/block]
***

> Provide an `onLoad` callback function

[block:code]
{
    "codes": [
        {
            "code": "// onLoad is called once your page has fired its load event.\n// all of the scripts, stylesheets, html and other resources\n// are guaranteed to be available at this point.\ncy.visit(\"http://localhost:3000/#/users\", {\n  onLoad: function(contentWindow){\n    // contentWindow is the remote page's window object\n    if(contentWindow.angular){\n      // do something\n    }\n  }\n})\n",
            "language": "js"
        }
    ]
}
[/block]

***

## Notes

> Visit will always yield the remote page's window object when it resolves

[block:code]
{
    "codes": [
        {
            "code": "cy.visit(\"index.html\").then(function(contentWindow)){\n  // contentWindow is the remote page's window object\n}\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Visit will automatically follow redirects

[block:code]
{
    "codes": [
        {
            "code": "// we aren't logged in, and our webserver\n// redirects us to /login\ncy\n  .visit(\"http://localhost3000/admin\")\n  .url().should(\"match\", /login/)\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Cypress automatically wipes page state between visits

Whenever you `cy.visit(...)`, Cypress will automatically wipe the state of the page before navigating to an external page.

Internally Cypress will visit `about:blank` which flushes the window.

[block:code]
{
    "codes": [
        {
            "code": "// internally this does the following:\n// visit 'dashboard'\n// visit 'about:blank'\n// visit 'users'\ncy\n  .visit(\"dashboard\")\n\n  ...more commands...\n\n  .visit(\"users\")\n\n",
            "language": "js"
        }
    ]
}
[/block]

***

> Preventing XHR / AJAX requests before a remote page initially loads

One common scenario Cypress supports is visiting a remote page and also preventing any AJAX requests from immediately going out.

You may think this works:

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .visit(\"http://localhost:8000/#/app\")\n  .server()\n  .route(/users/, {...})\n",
            "language": "js"
        }
    ]
}
[/block]

But if your app makes a request upon being initialized, **the above code will not work**.  `cy.visit(...)` will resolve once its `load` event fires.  The `server` and `route` commands are not processed until **after** `visit` resolves.

Many applications will have already begun routing, initialization, and requests by the time `visit` resolves. Therefore creating a `cy.server` will happen too late, and Cypress will not process the requests.

Luckily Cypress supports this use case easily. Simply reverse the order of the commands:

[block:code]
{
    "codes": [
        {
            "code": "cy\n  .server()\n  .route(/users/, {...})\n  .visit(\"http://localhost:8000/#/app\")\n",
            "language": "js"
        }
    ]
}
[/block]

Cypress will automatically apply the server + routes to the very next `visit` and does so immediately before any of your application code runs.

***

## Related
1. [navigate](navigate)