---
title: Network Requests
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- How Cypress enables you to isolate any or all of your front-end with {% url `cy.server()` server %} and {% url `cy.route()` route %}
- What tradeoffs we make when we stub our network requests
- How Cypress visualizes network management in the Command Log
- How to use Fixtures to reuse XHR responses
- How to use Aliases to refer back to XHR requests and wait on them
- How to write declarative tests that resist flake
{% endnote %}

# Testing Strategies

Cypress makes it easy to test the entire lifecycle of AJAX / XHR requests within your application. Cypress provides you direct access to the XHR objects, enabling you to make assertions about its properties. Additionally you can even stub and mock a request's response.

***Common testing scenarios:***

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

## Don't Stub Responses

Requests that are not stubbed actually reach your server. By *not* stubbing your responses, you are writing true *end to end* tests. This means you are driving your application the same way a real user would.

> When requests are not stubbed, this guarantees that the *contract* between your client and server is working correctly.

In other words, you can have confidence your server is sending the correct data in the correct structure to your client to consume. It is a good idea to have *end to end* tests around your application's *critical paths*. These typically include user login, signup, or other critical paths such as billing.

***There are downsides to not stubbing responses you should be aware of:***

- Since no responses are stubbed, that means **your server has to actually send real responses**. This can be problematic because you may have to *seed a database* before every test to generate state. For instance, if you were testing *pagination*, you'd have to seed the database with every object that it takes to replicate this feature in your application.
- Since real responses go through every single layer of your server (controllers, models, views, etc) the tests are often **much slower** than stubbed responses.

If you are writing a traditional server-side application where most of the responses are `HTML` you will likely have few stubbed responses. However, most modern applications that serve `JSON` can take advantage of stubbing.

{% note success Benefits %}
- Guaranteed to work in production
- Test coverage around server endpoints
- Great for traditional server-side HTML rendering
{% endnote %}

{% note danger Downsides %}
- Requires seeding data
- Much slower
- Harder to test edge cases
{% endnote %}

{% note info Suggested Use %}
- Use sparingly
- Great for the *critical paths* of your application
- Helpful to have one test around the *happy path* of a feature
{% endnote %}

## Stub Responses

Stubbing responses enables you to control every aspect of the response, including the response `body`, the `status`, `headers`, and even network `delay`. Stubbing is extremely fast, most responses will be returned in less than 20ms.

> Stubbing responses is a great way to control the data that is returned to your client.

You don't have to do any work on the server. Your application will have no idea it's requests are being stubbed, so there are *no code changes* needed.

{% note success Benefits %}
- Easy control of response bodies, status, and headers
- Can force responses to take longer to simulate network delay
- No code changes to your server or client code
- Fast, < 20ms response times
{% endnote %}

{% note danger Downsides %}
- No guarantee your stubbed responses match the actual data the server sends
- No test coverage on some server endpoints
- Not as useful if you're using traditional server side HTML rendering
{% endnote %}

{% note info Suggested Use %}
- Use for the vast majority of tests
- Mix and match, typically have one true end to end test, and then stub the rest
- Perfect for JSON API's
{% endnote %}

# How to Stub Responses

Cypress makes it easy to stub a response and control the `body`, `status`, `headers`, or even delay.

***To begin stubbing responses you need to do two things.***

1. Start a {% url `cy.server()` server %}
2. Provide a {% url `cy.route()` route %}

These two commands work together to control the behavior of your responses within the command's options. {% url `cy.server()` server %} enables stubbing, while {% url `cy.route()` route %} provides a routing table so Cypress understands which response should go with which request.

{% note info %}
See {% url '`cy.server()` options' server#Options %} and {% url '`cy.route()` options' route#Options %} for instructions on how to stub responses.
{% endnote %}

# Requests

Cypress automatically indicates when an XHR request happens in your application. These are always logged in the Command Log (regardless of whether it's stubbed). Cypress indicates when a request has started and when it is finished. Additionally, Cypress takes a snapshot of the DOM at the moment the request is made and another snapshot at the moment the response returns.

![snapshot_request](https://user-images.githubusercontent.com/1271364/26947393-930508b0-4c60-11e7-90a0-4d42ee3f24c0.gif)

By default, Cypress is configured to *ignore* requests that are used to fetch static content like `.js` or `.html` files. This keeps the Command Log less noisy. This option can be changed in the {% url 'configuration' configuration %}.

Cypress automatically collects the request `headers` and the request `body` and will make this available to you.

# Server + Routing Table

```javascript
cy.server()           // enable response stubbing
cy.route({
  method: 'GET',      // Route all GET requests
  url: '/users/*',    // that have a URL that matches '/users/*'
  response: []        // and force the response to be: []
})
```

When you start a {% url `cy.server()` server %} and define {% url `cy.route()` route %} commands, Cypress displays this under "Routes" in the Command Log.

{% img /img/guides/server-routing-table.png Routing Table %}

Once you start a server with {% url `cy.server()` server %}, all requests will be controllable for the remainder of the test. When a new test runs, Cypress will restore the default behavior and remove all routing and stubbing. For a complete reference of the API and options, refer to the documentation for each command.

- {% url `cy.server()` server %}
- {% url `cy.route()` route %}

# Fixtures

A fixture is a fixed set of data located in a file that is used in your tests. The purpose of a test fixture is to ensure that there is a well known and fixed environment in which tests are run so that results are repeatable. Fixtures are accessed within tests by calling the {% url `cy.fixture()` fixture %} command.

Cypress makes it easy to stub a network requests and have it respond instantly with fixture data.

When stubbing a response, you typically need to manage potentially large and complex JSON objects. Cypress allows you to integrate fixture syntax directly into responses.

```javascript
cy.server()

// we set the response to be the activites.json fixture
cy.route('GET', 'activities/*', 'fixture:activities.json')
```

You can additionally reference {% url 'aliases' aliases-and-references %} within responses. These aliases do not have to point to fixtures, but that is a common use case. Separating out a fixture enables you to work and mutate that object prior to handing it off to a response.

```javascript
cy.server()

cy.fixture('activities.json').as('activitiesJSON')
cy.route('GET', 'activities/*', '@activitiesJSON')
```

## Organizing Fixtures

Cypress automatically scaffolds out a suggested folder structure for organizing your fixtures on every new project. By default it will create an `example.json` file when you add your project to Cypress.

```text
/cypress/fixtures/example.json
```

Your fixtures can be further organized within additional folders. For instance, you could create another folder called `images` and add images:

```text
/cypress/fixtures/images/cats.png
/cypress/fixtures/images/dogs.png
/cypress/fixtures/images/birds.png
```

To access the fixtures nested within the `images` folder, simply include the folder in your {% url `cy.fixture()` fixture %} command.

```javascript
cy.fixture("images/dogs.png") //returns dogs.png as Base64
```

# Waiting

Whether or not you choose to stub responses, Cypress enables you to declaratively {% url `cy.wait()` wait %} for requests and their responses.

```javascript
cy.server()
cy.route('activities/*', 'fixture:activities').as('getActivities')
cy.route('messages/*', 'fixture:messages').as('getMessages')

// visit the dashboard, which should make requests that match
// the two routes above
cy.visit('http://localhost:8888/dashboard')

// pass an array of Route Aliases that forces Cypress to wait
// until it sees a response for each request that matches
// each of these aliases
cy.wait(['@getActivities', '@getMessages'])

// these commands will not run until the wait command resolves above
cy.get('h1').should('contain', 'Dashboard')
```

## Removing Flake

One advantage of declaratively waiting for responses is that it decreases test flake. You can think of {% url `cy.wait()` wait %} as a guard that indicates to Cypress when you expect a request to be made that matches a specific routing alias. This prevents the next commands from running until responses come back and it guards against situations where your requests are initially delayed.

***Auto-complete Example:***

What makes this example below so powerful is that Cypress will automatically wait for a request that matches the `getSearch` alias. Instead of forcing Cypress to test the *side effect* of a successful request (the display of the Book results), you can test the actual *cause* of the results.

```javascript
cy.server()
cy.route('/search*', [{item: 'Book 1'}, {item: 'Book 2'}]).as('getSearch')

// our autocomplete field is throttled
// meaning it only makes a request after
// 500ms from the last keyPress
cy.get('#autocomplete').type('Book')

// wait for the request + response
// thus insulating us from the
// throttled request
cy.wait('@getSearch')

cy.get('#results')
  .should('contain', 'Book 1')
  .and('contain', 'Book 2')
```

## Clear Source of Failure

In our example above, we added an assertion to the display of the search results.

***The search results working are coupled to a few things in our application:***

1. Our application making a request to the correct URL.
2. Our application correctly processing the response.
3. Our application inserting the results into the DOM.

In this example, there are many possible sources of failure. In most testing tools, if our request failed to go out, we would normally only ever get an error once we attempt to find the results in the DOM and see that there is no matching element. This is problematic because it's unknown *why* the results failed to be displayed. Was there a problem with our rendering code? Did we modify or change an attribute such as an `id` or `class` on an element? Perhaps our server sent us different Book items.

With Cypress, by adding a {% url `cy.wait()` wait %}, you can more easily pinpoint your specific problem. If the response never came back, you'll receive an error like this:

{% img /img/guides/clear-source-of-failure.png Wait Failure %}

Now we know exactly why our test failed. It had nothing to do with the DOM. Instead we can see that either our request never went out or a request went out to the wrong URL.

## Asserting about the XHR Object

Another benefit of using {% url `cy.wait()` wait %} on requests is that it allows you to access the actual `XHR` object. This is useful when you want to make assertions about this object.

In our example above we can assert about the request object to verify that it sent data as a query string in the URL. Although we're mocking the response, we can still verify that our application sends the correct request.

```javascript
cy.server()
cy.route('search/*', [{item: 'Book 1'}, {item: 'Book 2'}]).as('getSearch')

cy.get('#autocomplete').type('Book')

// this yields us the XHR object which includes
// fields for request, response, url, method, etc
cy.wait('@getSearch')
  .its('url').should('include', '/search?query=Book')

cy.get('#results')
  .should('contain', 'Book 1')
  .and('contain', 'Book 2')
```

***The XHR object that {% url `cy.wait()` wait %} yields you has everything you need to make assertions including:***

- URL
- Method
- Status Code
- Request Body
- Request Headers
- Response Body
- Response Headers
