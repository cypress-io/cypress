---
title: Testing Your App
comments: false
---

{% note info %}
# {% fa fa-graduation-cap %} What You'll Learn

- The relationship between Cypress and your back-end
- Configuring Cypress to fit your app
- Working with (or without!) your authentication mechanism
- Effectively leveraging test data
{% endnote %}

We covered Cypress in a tutorial app, now let's integrate it into your **real** app!

# Add Cypress to Your App

Add Cypress to your app as we did before with `npm`:

```shell
$ npm install cypress --save-dev
```

...and make yourself an `npm` script in `package.json` to run it easily (we named it "test-cypress" this time because we're assuming you already have a "test" script, but the name is arbitrary):

```json
{
  ...
  "scripts": {
    "test-cypress": "cypress open"
  }
  ...
}
```

Now you can run Cypress from the command line by typing `npm run test-cypress`, do so now. Cypress will open and generate the needed files to get started. (You may delete `./cypress/integration/example_spec.js` if you wish, it is only provided as, you guessed it, an example.)

{% note info Which Project To Install To? %}
Does your application have multiple project repositories? Many modern applications do! Cypress should be installed with your *front-end project*.
{% endnote %}

# Visit Your Development URL

# Useful Configuration Options

# Think Through Your Testing Strategy

## Logging In with Speed and Grace

## Preparing the Back-end Data Store

## Ignoring the Back-end with Network Stubbing

<!-- To round out this guide, let's actually test _your_ app! (You do have an app to test, right?)

First, create a new test file in the `cypress/integration` folder named `my_spec.js` (or whatever you want, the name is not meaningful.) We'll fill in a quick smoke test to make sure we can visit the app:

```js
describe.only('My App', function() {
  it('can be visited', function() {
    cy.visit('http://localhost:3000')
  })
})
```

Save this file, open Cypress, and click on the `my_spec.js` file. This should be the only test that runs because we leveraged `.only` on the `describe` block, and it should fail because we didn't start our server

Why? Well, remember that Cypress is back-end agnostic: it doesn't know _anything_ about your app server, let alone whether it is running or not. All Cypress can do is attempt to visit the link you gave it and report back about the response it gets. No response? Must not be running!

This is where your own knowledge of your app comes in, as you'll need to boot your app server into an appropriate mode for testing. What this means is entirely app-dependent: Cypress doesn't know anything about your environment, and we couldn't hope to guess anything about it for this guide, either!

Start your server and re-run the tests in Cypress. You will see your web app booted up inside the Cypress browser and ready to be automated. Score!

# Avoiding Authentication

Now that you've gotten your server running and you're considering what to test next, you're probably realizing something common to most modern web apps: all the interesting functionality is behind a login form!


For now, we recommend that you toy around with Cypress in the public areas of your website (perhaps your marketing pages, documentation, ...or even the login form itself if that's really all you have!)

Try to write some simple tests on your own, and for the moment don't worry if they are "good tests", you just want to get a feel for the texture of Cypress tests. Some things to try:

- Get some elements based on their content using {% url `.contains()` contains %}.
- Click on things using {% url `.click()` click %}.
- Assert that the page title has changed after clicking a link using {% url `cy.title()` title %} .

{% note warning %}
Does your app have pre-existing errors that are causing Cypress to fail?

Cypress is actually working as expected: those errors are real errors and need to be fixed in your application!
{% endnote %} -->

 <!-- However, we understand that developers don't always have complete control over their environment and need a little help from time to time. If you need to disable this behavior of Cypress (at your own risk), you can..._ -->
<!--
Configuration:
- baseUrl
- ignore existing errors? -->
