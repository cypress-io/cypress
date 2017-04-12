slug: network-requests-xhr
excerpt: A guide to managing XHR requests

# Contents

- :fa-angle-right: [Strategy](#strategy)
  - [1: Don't Stub Responses](#1-don-1-stub-responses)
  - [2: Stub Responses](#2-stub-responses)
- :fa-angle-right: [How to Stub Responses](#how-to-stub-responses)
- :fa-angle-right: [Requests](#requests)
- :fa-angle-right: [Server + Routing Table](#server-routing-table)
- :fa-angle-right: [Fixtures](#fixtures)
- :fa-angle-right: [Waiting](#waiting)
  - [Removing Flake](#removing-flake)
  - [Clear Source of Failure](#clear-source-of-failure)
  - [Asserting about the XHR Object](#asserting-about-the-xhr-object)

***

# Strategy

Cypress makes it easy to manage the entire lifecyle of AJAX / XHR requests within your application. Cypress provides you direct access to the XHR objects, enabling you to make assertions about its properties. Additionally you can even stub and mock a request's response.

**Common testing scenarios:**

- Asserting on a request's body
- Asserting on a request's url
- Asserting on a request's headers
- Stubbing a response's body
- Stubbing a response's status code
- Stubbing a response's headers
- Delaying a response
- Waiting for a response to happen

Within Cypress, you have the ability to choose whether to stub responses or allow them to actually hit your server. You can also mix and match within the same test by choosing to stub certain requests, while allowing others to hit your server.

Let's investigate both strategies, why you would use one versus the other, and why you should regularly use both.

***

## 1: Don't Stub Responses

Requests that aren't stubbed will actually reach your server. By *not* stubbing your responses, you are writing true **end to end** tests. This means you are driving your application the same way a real user would.

> When requests are not stubbed, this gaurantees the *contract* between your client and server is working correctly.

In other words, you can have confidence your server is sending the correct data in the correct structure for your client to consume. It is a good idea to have **end to end** tests around your application's *critical paths*. These typically include user login, signup, and other critical paths such as billing.

**There are downsides to not stubbing responses you should be aware of:**

- Since no responses are stubbed, that means your server has to *actually send real responses*. This can be problematic because you may have to *seed a database* before every test to generate state. For instance, if you were testing **pagination**, you'd have to seed the database with every object that it takes to replicate this feature in your application.
- Since real responses go through every single layer of your server (controllers / models / views) the tests are often *much* slower than stubbed responses.

If you are writing a traditional server-side application where most of the responses are `HTML` you will likely have few stubbed responses. However, most modern applications that serve `JSON` can take advantage of stubbing.

[block:callout]
{
  "type": "success",
  "body": "- Guaranteed to work in production\n- Test coverage around server endpoints\n- Great for traditional server-side HTML rendering",
  "title": "Benefits"
}
[/block]

[block:callout]
{
  "type": "danger",
  "body": "- Requires seeding\n- Much slower\n- Hard to test edge cases",
  "title": "Downsides"
}
[/block]

[block:callout]
{
  "type": "info",
  "body": "- Use sparingly\n- Great for the *critical paths* of your application\n- Helpful to have one test around the *happy path* of a feature",
  "title": "Suggestions"
}
[/block]

***

## 2: Stub Responses

Stubbing responses enables you to control every aspect of the response, including the response body, the status, headers, and even network delay. Stubbing is extremely fast, most responses will be returned in less than 20ms.

> Stubbing responses is a great way to control the data that is returned to your client.

You don't have to do any work on the server. Your application will have no idea it's requests are being stubbed, so there are **no code changes** needed. In fact, stubbed requests will show up in the Network tab of your Developer Tools, and your application will continue to work after the test is finished.

[block:callout]
{
  "type": "success",
  "body": "- Easy control of response bodies, status, and headers\n- Force responses to take longer to simulate network delay\n- No code changes to your server or client code\n- Fast, < 20ms response times\n- Perfect for JSON API's",
  "title": "Benefits"
}
[/block]

[block:callout]
{
  "type": "danger",
  "body": "- No guarantee your stubbed responses match the actual data your server sends\n- No test coverage on some server endpoints\n- Not as useful if you're using traditional server side HTML rendering",
  "title": "Downsides"
}
[/block]

[block:callout]
{
  "type": "info",
  "body": "- Use for the vast majority of your testing\n- Mix and match, typically have one true end to end test, and then stub the rest",
  "title": "Suggestions"
}
[/block]

***

# How to stub responses

Cypress makes it easy to stub a response and control the `body`, `status`, `headers`, or even delay.

To begin stubbing responses you have to do two things.

1. Start a [`cy.server`](https://on.cypress.io/api/server)
2. Provide a [`cy.route`](https://on.cypress.io/api/route)

These two commands work together to control the behavior of your responses within the command's options. See [`cy.server` options](https://on.cypress.io/api/server#options) and [`cy.route` options](https://on.cypress.io/api/route#options) for instructions on how to stub responses.

[`cy.server`](https://on.cypress.io/api/server) enables stubbing, while [`cy.route`](https://on.cypress.io/api/route) provides a routing table so Cypress understands which response should go with which request.

***

# Requests

Cypress will automatically indicate when an XHR request happens in your application. These are logged in the Command Log regardless of whether or not you are using stubbing. This provides you a visual indicator when a request has started and when it is finished. Additionally, Cypress will take a snapshot of the DOM when the request is made and another snapshot when the response comes back.

By default, Cypress is configured to *ignore* requests that are used to fetch static content like `.js` or `.html` files. This keeps the Command Log less noisy. This option can be changed in the [configuration](https://on.cypress.io/guides/configuration).

Cypress automatically collects the request `headers` and the request `body` and will make this available to you.

***

# Server + Routing Table

```javascript
cy
  // enable response stubbing
  .server()

  // Route all GET requests that have a
  // URL that matches the RegExp /users/
  // and force the response to be: []
  .route({
    method: "GET",
    url: /users/,
    response: []
  })
```

Each [`cy.route`](https://on.cypress.io/api/route) you provide will automatically route those requests to specific responses and control their body, response headers, or even force additional network delay.

When you start a server and provide a routing table, Cypress will display this under "Routes" in the Command Log.

![Routing Table](https://cloud.githubusercontent.com/assets/1268976/10780221/91743ab8-7d11-11e5-9fe1-8bcbdf5e344c.png)

Once you start a server with [`cy.server`](https://on.cypress.io/api/server), all requests will be controllable for the remainder of the test. When a new test runs, Cypress will restore the default behavior and remove all routing and stubbing. For a complete reference of the API and options, refer to the documentation for each command.

- [`cy.server`](https://on.cypress.io/api/server)
- [`cy.route`](https://on.cypress.io/api/route)

***

# Fixtures

When stubbing a response, you typically need to manage potentially large and complex JSON objects. Cypress has support for [fixtures](https://on.cypress.io/guides/creating-fixtures), and even allows you to integrate fixture syntax directly into responses.


```javascript
cy
  .server()

   // we set the response to be the activites.json fixture
  .route("GET", /activities/, "fixture:activities.json")
```

You can additionally reference [aliases](https://on.cypress.io/guides/using-aliases) within responses. These aliases do not have to point to fixtures, but that is a common use case. Separating out a fixture enables you to work and mutate that object prior to handing it off to a response.


```javascript
cy
  .server()

  .fixture("activities.json").as("activitiesJSON")
  .route("GET", /activities/, "@activitiesJSON")
```

***

# Waiting

Whether or not you choose to stub responses, Cypress enables you to declaratively [`cy.wait`](https://on.cypress.io/api/wait) for requests and their responses.

```javascript
cy
  .server()
  .route(/activities/, "fixture:activities").as("getActivities")
  .route(/messages/, "fixture:messages").as("getMessages")

  // visit the dashboard, which should make requests that match
  // the two routes above
  .visit("http://localhost:8888/dashboard")

  // pass an array of Route Aliases which forces Cypress to wait
  // until it sees a response for each request that matches
  // each of these aliases
  .wait(["@getActivities", "@getMessages"])

  // these commands will not run until the wait command resolves above
  .get("h1").should("contain", "Dashboard")
```

Declaratively waiting for responses has many advantages:
- You descrease test flake
- Source of failure is clearer
- You can make assertions about the XHR objects

***

## Removing Flake

One advantage of declaratively waiting for requests is that it decreases test flake. You can think of [`cy.wait`](https://on.cypress.io/api/wait) as a guard that indicates to Cypress when you expect a request to be made that matches a specific routing alias. This prevents commands from running until responses come back and it guards against situations where your requests are initially delayed.

**Auto-complete Example:**

```javascript
cy
  .server()
  .route(/search/, [{item: "Book 1"}, {item: "Book 2"}]).as("getSearch")

  // our autocomplete field is throttled
  // meaning it only makes a request after
  // 500ms from the last keyPress
  .get("#autocomplete").type("Book")

  // wait for the request + response
  // thus insulating us from the
  // throttled request
  .wait("@getSearch")

  .get("#results")
    .should("contain", "Book 1")
    .and("contain", "Book 2")
```

What makes this example above so powerful is that Cypress will automatically wait for a request that matches the `getSearch` alias. Instead of forcing Cypress to test the *side effect* of a successful request (the display of the Book results), you can test the actual *cause* of the results.

***

## Clear Source of Failure

In our example above, we added an assertion to the display of the search results.

**The search results working are coupled to a few things in our application:**

1. Our application making a request to the correct URL.
2. Our application correctly processing the response.
3. Our application inserting the results into the DOM.

In this example, there are many possible sources of failure. In most testing tools, if our request failed to ever go out, we would normally only ever get an error once we attempt to find the results in the DOM and see that there is no matching element. This is problematic because it's unknown *why* the results failed to be displayed. Was there a problem with our rendering code? Did we modify or change an attribute such as an `id` or `class` on an element? Perhaps our server sent us different Book items.

With Cypress, by adding a [`cy.wait`](https://on.cypress.io/api/wait) guard, you can more easily pinpoint your specific problem. If the request never went out, you'll receive errors like this.

![wait failure](https://cloud.githubusercontent.com/assets/1268976/10780062/a9c3245a-7d0f-11e5-9984-67d84650b0a0.png)

Now we know exactly why our test failed. It had nothing to do with the DOM. Instead we can see that either our request never went out or a request went out to the wrong URL.

***

## Asserting about the XHR Object

Another benefit of using [`cy.wait`](https://on.cypress.io/api/wait) on requests is that it allows you to access the actual `XHR` object. This is useful when you want to make assertions about this object.

In our example above we can assert about the request object to verify that it sent data as a query string in the URL. Although we're mocking the response, we can still verify that our application sends the correct request.


```javascript
cy
  .server()
  .route(/search/, [{item: "Book 1"}, {item: "Book 2"}]).as("getSearch")

  .get("#autocomplete").type("Book")

  // this yields us the XHR object which includes
  // fields for request, response, url, method, etc
  .wait("@getSearch")
    .its("url").should("include", "/search?query=Book")

  .get("#results")
    .should("contain", "Book 1")
    .and("contain", "Book 2")
```

**The XHR object that [`cy.wait`](https://on.cypress.io/api/wait) yields you has everything you need to make assertions including:**

- URL
- Method
- Status Code
- Request Body
- Request Headers
- Response Body
- Response Headers
