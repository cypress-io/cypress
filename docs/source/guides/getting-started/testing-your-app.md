---
title: Testing Your App
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- The relationship between Cypress and your back-end
- How authentication trips impedes testability... but doesn't have to
- How sensitive Cypress is to errors from _anywhere_
- Configuration options to ease your pain
{% endnote %}

# Once More With Feeling!

To round out this guide, let's actually test _your_ app! (You do have an app to test, right?) Create a new test file in the `cypress/integration` folder named `my_spec.js` (or whatever you want, the name is not meaningful.) We'll fill in a quick smoke test to make sure we can visit the app:

```js
describe.only('My App', function() {
  it('can be visited', function() {
    cy.visit('http://localhost:3000')
  })
})
```

Save this file, open Cypress, and run the tests. This should be the only test that runs because we leveraged `.only` on the `describe` block, and it should fail because we didn't start our server (see image below)

![Cypress Can't Find Your Server](http://placehold.it/1920x1080)

Why? Well, remember that Cypress is back-end agnostic: it doesn't know _anything_ about your app server, let alone whether it is running or not. All Cypress can do is attempt to visit the link you gave it and report back about the response it gets. No response? Must not be running!

This is where your own knowledge of your app comes in, as you'll need to boot your app server into an appropriate mode for testing. What this means is entirely app-dependent: Cypress doesn't know anything about your environment, and we couldn't hope to guess anything about it for this guide, either!

_Aside: Look at our page dedicated to framework-specific server-side patterns and adapters_

Start your server and re-run the tests in Cypress. You will see your web app booted up inside the Cypress Chromium browser and ready to be automated. Score!

# Avoiding Authentication

Now that you've gotten your server running and you're considering what to test next, you're probably realizing something common to most modern web apps: all the interesting functionality is behind a login form! This is a major hurdle to fast tests, and it's something we're going to visit in detail later in this guide.

For now, we recommend that you toy around with Cypress in the public areas of your website (perhaps your marketing pages, documentation, ...or even the login form itself if that's really all you have!)

Try to write some simple tests on your own, and for the moment don't worry if they are "good tests", you just want to get a feel for the texture of Cypress tests. Some things to try:

- Find some elements based on their contents.
- Click on things.
- Assert that the page title has changed after following a link.

_Aside: Does your app have pre-existing errors that are causing Cypress to fail? Oops! Cypress is actually working as expected: those errors are real errors and need to be fixed! However, we understand that developers don't always have complete control over their environment and need a little help from time to time. If you need to disable this behavior of Cypress (at your own risk), you can..._

Configuration:
- baseUrl
- ignore existing errors?
