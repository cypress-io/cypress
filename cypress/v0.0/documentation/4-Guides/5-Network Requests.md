excerpt: Manage AJAX/XHR requests
slug: network-requests-xhr

Cypress makes it easy to manage the entire lifecyle of AJAX / XHR requests within your application.

<!-- add image of requests / routing table / aliasing / waiting, etc -->

Cypress provides you direct access to the XHR objects, enabling you to make assertions about its properties.

Additionally you can even stub and control a request's response.

<!-- make these linkable to below -->

Common testing scenarios:
- Asserting on a request's body
- Asserting on a request's url
- Asserting on a request's headers
- Stubbing a response's body
- Stubbing a response's status code
- Stubbing a response's headers
- Delaying a response
- Waiting for a response to happen

## Strategy

Within Cypress you have the ability to choose whether to stub responses or allow them to actually reach your server.

You can also mix and match within the same test by choosing to stub certain requests, while allowing others to reach your server.

Let's investigate both strategies, why you'd use one vs the other, and why you should regularly use both.

### Option #1: Don't Stub Responses

Requests which aren't stubbed means they will actually reach your server.

By not stubbing your responses you are writing true **end to end** tests. This means you are driving your application the same way as a real user would.

When requests are not stubbed this gaurantees the *contract* between your client and server is correct. In other words, you can feel confident everything is working. Your server is sending the correct data in the correct structure for your client to consume.

It is a good idea to have **end to end** tests around your application's *critical paths*. These typically include **user login**, **signup**, etc.

There are downsides to not stubbing responses you should be aware of. Since no responses are stubbed, that means your server has to *actually send real responses*. This becomes problematic because that means prior to every test you'll likely have to *seed the database* to generate the state you wish to test. Oftentimes a huge amount of effort goes into this process.

For instance if you were testing **pagination** you'd have to seed the database with every object that it takes to actually introduce this feature in your application.

Additionally since real responses go through every single layer of your server (controllers / models / views) they are often orders of magitude slower than stubbed responses.

If you are writing a traditional server-side application where most of the responses are `HTML` you will likely have few stubbed responses. However most modern applications which serve `JSON` can take advantage of stubbing.

**Benefits**
- Guaranteed to work in production
- Test coverage around server endpoints
- Great for traditional server-side html rendering

**Downsides**
- Requires seeding
- Many times slower
- Hard to test edge cases

**Suggestions**
- Use sparingly
- Great for the *critical paths* of your application
- Helpful to have one test around the *happy path* of a feature

### Option #2: Stub Responses

Stubbing responses enables you to control every aspect of the response, including the response body, the status, headers, or even network delay.

Stubbing is extremely fast, most responses will be returned in <20ms.

Stubbing responses is a great way to control the data that is returned to your client. You don't have to do any work on the server.

Your application will have no idea it's requests are being stubbed, and therefore there are **no code changes** needed.

In fact stubbed requests will still show up in your Network tab, and your application will even continue to work after the test is finished.

**Benefits**
- Easy control of response bodies, status, headers
- Force responses to take longer to simulate network delay
- No code changes to your server or client code, it's all transparent.
- Super fast, <20ms response times
- Perfect for `JSON` API's

**Downsides**
- No guarantee your stubbed responses match the actual data your server sends
- No test coverage on some server endpoints
- Not as useful if you're using traditional server side `HTML` rendering

**Suggestions**
- Use for the vast majority of your testing
- Mix and match, typically have one true end to end test, and then stub the rest

## Requests

Cypress will automatically indicate when an XHR request happens in your application. These are logged in Command Log regardless of whether or not you are using stubbing. This provides you a visual indicator when a request has happened and when it is finished. Additionally, Cypress will take a snapshot of the DOM when the request is made, and another one the response comes back.

By default Cypress is configured to **ignore** requests that are used to fetch static content like `.js` or `.html` files. This keeps the Command Log less noisy, and this option is configuration.

Cypress automatically collects the request `headers` and the request `body` and will make this available to you.

<!-- picture of a multiple requests + clicking a request to see its console output -->

[Read below](#assertions) to understand how you can make assertions about these.

## Responses

Cypress makes it easy to stub a response and control the body, status, headers, or even delay.

To begin stubbing responses you have to do two things.

1. Start a `cy.server`
2. Provide a `cy.route`

These two commands work together to control the behavior of your responses.

`cy.server` enables stubbing, while `cy.route` provides a routing table so Cypress understands which response should go with which request.

#### Server + Routing Table

```javascript
cy
  // enable response stubbing
  .server()

  // Route all GET requests which have a
  // URL that matches the RegExp /users/
  // and force their responses to be: []
  .route({
    method: "GET",
    url: /users/,
    response: []
  })
```

Each `cy.route` you provide will automatically route those requests to specific responses and control their body, response headers, or even force additional network delay.

When you start a server and providing a routing table, Cypress will display this as a new Instrument Panel in your log.

![Routing Table](https://cloud.githubusercontent.com/assets/1268976/10780221/91743ab8-7d11-11e5-9fe1-8bcbdf5e344c.png)

Once you start a server with `cy.server`, all requests will be controllable for the remainder of the test. When a new test runs, Cypress will restore the default behavior and remove all routing + stubbing.

For a complete reference of the API and options, refer to the documentation for each command.

- [cy.server](http://on.cypress.io/api/server)
- [cy.route](http://on.cypress.io/api/route)

## Fixtures

When stubbing a response, you typically need to manage potentially large and complex `JSON` objects.

Cypress has first class support for fixtures, and even allows you to integrate fixture syntax directly into responses.

```javascript
cy
  .server()

   // we set the response to be the `activites.json` fixture
  .route("GET", /activities/, "fixture:activities.json")
```

You can additionally reference aliases within responses. These aliases do not need to necessearily point to fixtures, but that is a common use case. Separating out the fixture enables you to work and mutate that object prior to handing it off to a response.

```javascript
cy
  .fixture("activities.json").as("activitiesJSON")
  .server()
  .route("GET", /activities/, "@activitiesJSON")
```

## Waiting

Whether or not you choose to stub responses, Cypress enables you to declaratively wait for requests and their responses.

```javascript
cy
  .server()
  .route(/dashboard/, "fixture/dashboard").as("getDashboard")
  .route(/activities/, "fixture/activities").as("getActivities")
  .route(/messages/, "fixture/messages").as("getMessages")

  // visit the dashboard, which should make requests which match
  // the three routes above
  .visit("http://localhost:8888/dashboard")

  // pass an array of Route Aliases which forces Cypress to wait
  // until it sees a response for each request that matches
  // each of these aliases
  .wait(["@getDashboard", "@getActivities", "@getMessages"])
```

Declaratively waiting for responses unlocks many advantages:
- You remove all chance of test flake
- Failures are instantly clear
- You receive access and make assertions about the XHR objects

#### Removing Flake

One advantage of declaratively waiting for requests is that it decreases the chances of test flake.

You can think of `cy.wait` as a guard which indicates to Cypress that you expect a request to be made that matches a specific routing alias. This is great because not only does it prevent commands from running until responses come back, but it also guards against situations where your requests are initially delayed.

One example may be an auto complete.

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

What makes this so powerful is that Cypress will automatically wait for a request that matches the `getSearch` alias.

Instead of forcing Cypress to test the *side effect* of a successful request, which would be the displaying of the *Book results*, you can test the actual *cause* of the results.

This brings us to advantage #2.

#### Clear Failures

In our example above, we added an assertion around the displaying of the search results. But the search results are coupled directly to our application making a request to the right URL, our application correctly processing the response, and then actually inserting the results into the DOM.

In this example, there are many possible points of failure. In most testing tools if our request failed to ever go out, we would normally only ever get an error once we attempt to find the results in the DOM.

This is problematic because it's unknown why the results failed to be displayed. Was there a problem with our rendering code? Did we modify or change an attribute such as an `id` or `class` on an element? Perhaps our server sent us different Book items.

With Cypress, by adding a `cy.wait` guard, you will receive pinpoint accurate errors that point you to the specific problem. If the request never went out, you'll receive errors like this.

![wait failure](https://cloud.githubusercontent.com/assets/1268976/10780062/a9c3245a-7d0f-11e5-9984-67d84650b0a0.png)

Now we know exactly why our test failed. It had nothing to do with the DOM. Instead we'd be able to instantly see that the source of the problem was that either no request ever went out, or perhaps a request went out to the wrong URL.

#### Asserting about the XHR Object

The secondary benefit of waiting is that it actually allows you to access the actual `XHR` object. This is useful when you want to make assertions about this object.

In our example above we can insert an assertion about the request object, to verify that it did indeed send data as a query string in the URL. Although we're mocking the response, we can still verify that our application sends the correct request.

```javascript
cy
  .server()
  .route(/search/, [{item: "Book 1"}, {item: "Book 2"}]).as("getSearch")

  .get("#autocomplete").type("Book")

  // this yields us the XHR object which includes
  // fields for `request`, `response`, `url`, `method`, etc
  .wait("@getSearch")
    .its("url").should("include", "/search?query=Book")

  .get("#results")
    .should("contain", "Book 1")
    .and("contain", "Book 2")
```

The XHR object that `cy.wait` yields you contains everything you need to make assertions.
- URL
- Method
- Status Code
- Request Body
- Request Headers
- Response Body
- Response Headers

## Assertions
- counting number of requests
- asserting about request body / headers
- asserting about response body / headers / status