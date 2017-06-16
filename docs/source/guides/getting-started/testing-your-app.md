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
Does your application have multiple project repositories? Many modern applications do! Cypress should be installed with your *front-end project*, wherever you serve the front-end files for development.
{% endnote %}

# Visit Your Development URL

First things first, you'll want to visit your app, plain and simple. We'll start where your users start: the home page. Create a new file in the `./cypress/integration` folder, `home_page_spec.js`, and fill it in with a simple test that calls the `cy.visit()` command, something like this:

```js
describe("The Home Page", function() {
  it("successfully loads", function() {
    cy.visit("http://localhost:8080/") // change URL to match your dev URL
  })
})
```

**You'll need to do 2 things for this example to work:**
1. Where does your dev server run? Change `http://localhost:8080/` to the correct URL for your environment.
2. You'll have to also start your server! If Cypress tries to visit before you've started your server, you'll see the error pictured below:

{% img /img/guides/getting-started/testing-your-app/visit-your-development-url.png %}

{% note info How do I run my app in development mode? %}
If you aren't sure about this, you'll need to track down someone on your team who is! Cypress expects its users to be members of a web development team who work on the application every day, able to boot the server and modify the code as they go.
{% endnote %}

Once you get your server booted, refresh the Cypress browser and you should see your application's home page in the app preview pane. Congratulations! You've just taken the first step toward a better integration testing experience for your web application.

# Useful Configuration Options

If you think ahead, you'll quickly realize that you're going to be typing this URL a lot, since every test is going to need to visit some page of your application. Luckily, Cypress anticipates this need and provides a configuration option for it. Let's leverage that immediately.

Open up `cypress.json`, which you will find in your project root (where you installed Cypress.) It starts out empty:

```js
{}
```

...we'll add an option to default our URL in all `cy.visit()` commands (make sure you use your URL if it is different!):

```js
{
  "baseUrl": "https://localhost:8080/"
}
```

Got it? Great! Now let's rewrite that test to just use the path we want to visit instead of the entire URL:

```js
describe("The Home Page", function() {
  it("successfully loads", function() {
    cy.visit("/")
  })
})
```

Refresh Cypress and have a look to make sure everything is working, then give yourself a pat on the back: that's a lot of typing our future selves won't be doing!

{% note info Configuration Options %}
Cypress has many more configuration options you can use to customize its behavior to your app. Things like where your tests live, default timeout periods, environment variables, which reporters to use, etc. Check them out in the {% url "Configuration Appendix" configuration %}!
{% endnote %}

# Think Through Your Testing Strategy

## Logging In with Speed and Grace

## Preparing the Back-end Data Store

## Ignoring the Back-end with Network Stubbing

# Get Started!

Ok, we're done slowing you down, dive in and test your app! From here you may want to have a look at the {% url "Cypress API" api %} to learn what commands are available as you work. Once you've written a few tests, {% url "Cypress in a Nutshell" cypress-in-a-nutshell %} is a must-read: it will teach you how Cypress _really_ works, and how to write effective Cypress tests.

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
