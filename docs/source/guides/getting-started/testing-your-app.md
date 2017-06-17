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

{% img /img/guides/visit-your-development-url.png %}

{% note info How do I run my app in development mode? %}
If you aren't sure about this, you'll need to track down someone on your team who is! Cypress expects its users to be members of a web development team who work on the application every day, able to boot the server and modify the code as they go.
{% endnote %}

Once you get your server booted, refresh the Cypress browser and you should see your application's home page in the app preview pane. Congratulations! You've just taken the first step toward a better integration testing experience for your web application.

# Configure Cypress to Go With Your Flow

If you think ahead, you'll quickly realize that you're going to be typing this URL a lot, since every test is going to need to visit some page of your application. Luckily, Cypress anticipates this need and provides a configuration option for it. Let's leverage that now.

Open up `cypress.json`, which you will find in your project root (where you installed Cypress.) It starts out empty:

```js
{}
```

...we'll add an option to default our URL in all `cy.visit()` commands (make sure you replace with *your* URL if it is different!):

```js
{
  "baseUrl": "https://localhost:8080/"
}
```

Got it? Great! Now let's rewrite the previous test to just use the path we want to visit instead of the entire URL:

```js
describe("The Home Page", function() {
  it("successfully loads", function() {
    cy.visit("/")
  })
})
```

Refresh Cypress and have a look to make sure everything is working, then give yourself a pat on the back: that's a lot of typing your future self won't be doing!

{% note info Configuration Options %}
Cypress has many more configuration options you can use to customize its behavior to your app. Things like where your tests live, default timeout periods, environment variables, which reporter to use, etc. Check them out in the {% url "Configuration Appendix" configuration %}!
{% endnote %}

# Think Through Your Testing Strategy

You're about to embark on writing tests for your application, and only _you_ know your application, so we don't have a lot of specific advise to give you. What to test, where the edge cases and seams are, what regressions you're likely to run into, etc. are entirely up to you and your team.

That said, modern web testing has a few wrinkles that every team experiences, so here's some quick tips on common situations you're likely to run into sooner than later.

## Logging In with Speed and Grace

Nothing slows a test suite like having to log in, but all the good parts of your application most likely require an authenticated user! Here's some tips.

### Fully Test the Login Flow, _Once_

It's a great idea to get your signup and login flow under test coverage since it is very important to all of your users and you never want it to break. We recommend you test signup and login the way you test most things in Cypress:

1. `cy.visit()` the page with the login form
2. `cy.get()` the username and password inputs and `.type()` into them
3. `cy.get()` the login form and `.submit()` it
4. make an appropriate assertion about the next page

You can quickly test your app's behavior like this for a number of scenarios. For the "happy path", you might include signing up before logging in. Next, incorrect usernames and passwords are obvious scenarios to test, and furthermore you might include edge cases like locked or deleted accounts, username or email already exists at signup, etc. Whatever you need assurances about, get it under coverage!

But don't try to reuse this login test for every other test...

### Short-Circuit the Login Flow Everywhere Else

Now that the signup and login flow are covered, we want to avoid them for tests that aren't specifically about them. For this, we can leverage `cy.request()`, which makes a web request _just like the browser, but outside of the browser_. Cypress will send all the appropriate cookies and headers, just like the browser would, but without engaging all of the graphical overhead of the browser.

This is where your own knowledge of your web app comes in: What does a login request look like for your app? You want to emulate that with `cy.request()` outright, instead of filling out a form and submitting it manually.

If you need help getting started with this, you could open up the dev tools and see what the form actually submits. Look at it to see what data you need to send, then do it directly. Keeping your tests fast depends on it!

## Preparing and Cleaning Up Test Data

If you're familiar with server-side unit testing, you're probably used to using fixtures or factories to build up state in the database before each test, and cleaning it up after. You may decide you want this flow for your client-side tests, as well. In that case, you'll need to bridge Cypress to your back-end, and again we'll use `cy.request()` for this task.

You'll want to add some routes to your application that only exist in the `test` environment so that you know they never exist in production. These routes simply take commands about the data you want to test against, bridging over to your fixtures and factories, or your "clear the data store" mechanism.

You might use this with the login advice above to create a user in the database before you log in, allowing you to skip the signup flow step (particularly useful for skipping email confirmation if you require it before the first login!) It's also easy to imagine building up different quantities of your business objects for testing the {% url "5 states of any user interface element: empty, partial, full, loading, and error." http://scotthurff.com/posts/why-your-user-interface-is-awkward-youre-ignoring-the-ui-stack %}

## Isolation from the Back-end with Network Stubbing

One final strategy that Cypress enables is complete isolation from your server via route stubbing. This is an absolute ninja trick, especially for web projects that have already separated their front-ends from their back-ends: separate repositories that get deployed to completely different places and only communicate over HTTP(S).

Cypress anticipates these kinds of projects and enables network stubbing via the `cy.server()` and `cy.route()` commands. You can declare the API calls you expect your application to make, then capture them before they hit the network and provide your own custom responses.

Since it skips the network and all of the code on the server, _this is fast_. It's also easier to maintain, as your tests can live with your front-end project and never need to coordinate spinning up a development server for another project. Continuous Integration is simpler because it doesn't need to package up the API server project. All of the login logic is simplified because it is no longer coordinating with the back-end, but rather reacting to canned responses.

# Get Started!

Ok, we're done talking for now, dive in and test your app! From here you may want to have a look at the {% url "Cypress API" api %} to learn what commands are available as you work. Once you've written a few tests, {% url "Introduction to Cypress" introduction-to-cypress %} is a must-read: it will teach you how Cypress _really_ works, and how to write effective Cypress tests.
