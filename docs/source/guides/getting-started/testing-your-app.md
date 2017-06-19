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

We covered Cypress in a tutorial app, now let's integrate it into your *real* app!

# Adding Your Project

After successfully logging in, you will need to add the project(s) you want to write Cypress tests in.

- Click {% fa fa-plus %} Add Project.

![Add Project in LeftHand Corner](https://cloud.githubusercontent.com/assets/1271364/22699969/fe44c2e4-ed26-11e6-83d0-9baa0f51b15e.png)

{% note info %}
Projects added in our Desktop Application are strictly local to your computer. They are not tracked in any way by Cypress servers and do not communicate with us until they are {% url "set up to be recorded" projects#Set-up-a-Project-to-Record %}.
{% endnote %}

**To run tests:**

- Click on the project.
- You will then come to a page listing all files in your project's `cypress/integration` folder. If it's a new project, you'll see a message about the folder structure generated for you and also an `example_spec.js` file.
- Click on the test file you want to run or click "Run All Tests".

# Visit Your Development URL

First things first, you'll want to visit your app, plain and simple. We'll start where your users start: the home page. Create a new file in the `./cypress/integration` folder, `home_page_spec.js`, and fill it in with a simple test that calls the {% url "`cy.visit()`" visit %} command, something like this:

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

If you think ahead, you'll quickly realize that you're going to be typing this URL a lot, since every test is going to need to visit some page of your application. Luckily, Cypress provides a {% url "configuration option" configuration %} for it. Let's leverage that now.

Open up `cypress.json`, which you will find in your project root (where you installed Cypress.) It starts out empty:


```json
{}
```

...we'll add an option to default our URL in all {% url "`cy.visit()`" visit %} commands (make sure you replace with *your* URL if it is different!):

```json
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

Refresh Cypress and have a look to make sure everything is still working, then give yourself a pat on the back: that's a lot of typing your future self won't be doing!

{% note info Configuration Options %}
Cypress has many more configuration options you can use to customize its behavior to your app. Things like where your tests live, default timeout periods, environment variables, which reporter to use, etc. Check them out in {% url "Configuration" configuration %}!
{% endnote %}

# Think Through Your Testing Strategy

You're about to embark on writing tests for your application, and only _you_ know your application, so we don't have a lot of specific advise to give you. What to test, where the edge cases and seams are, what regressions you're likely to run into, etc. are entirely up to you, your application, and your team.

That said, modern web testing has a few wrinkles that every team experiences, so here's some quick tips on common situations you're more likely to run into sooner than later.

## Logging In with Speed and Grace

Nothing slows a test suite like having to log in, but all the good parts of your application most likely require an authenticated user! Here are some tips.

**Fully Test the Login Flow, Once**

It's a great idea to get your signup and login flow under test coverage since it is very important to all of your users and you never want it to break. We recommend you test signup and login the way you test most things in Cypress:

> 1. {% url "`cy.visit()`" visit %} the page with the login form.
> 2. {% url "`cy.get()`" get %} the username and password `<input>` and {% url "`.type()`" type %} > into them.
> 3. Submit the form somehow ({% url `.type("{enter}")` type %} or {% url `cy.get('form').submit()` submit })
> 4. Make an assertion about what the next page should be.

Here's an example:

```js
it('sets auth cookie when logging in via form submission', function(){
  cy.visit('/login')

  cy.get('input[name=username]').type('jane.lane')
  // {enter} causes the form to submit
  cy.get('input[name=password]').type('password123{enter}')

  // we should be redirected to /dashboard
  cy.url().should('include', '/dashboard')
  // UI should reflect this user being logged in
  cy.get('h1').should('contain', 'jane.lane')
  // our auth cookie should be present
  cy.getCookie('cypress-session-cookie').should('exist')
})
```

You can quickly test your app's behavior like this for a number of scenarios. For the "happy path", you might include signing up, as well. Next, incorrect usernames and passwords are obvious scenarios to test, and furthermore you might include edge cases like locked or deleted accounts, username or email already exists at signup, etc. Whatever you need assurances about, get it under coverage!

But don't try to reuse this login test for every single test...

**Short-Circuit the Login Flow Everywhere Else**

Now that the signup and login flow are covered, we want to avoid them for the remainder of our tests because they are slow. For this, we can leverage {% url `cy.request()` request %}, which makes a web request _just like the browser, but outside of the browser_. Cypress will send all the appropriate `cookies` and `headers`, just like the browser would, but without engaging all of the graphical overhead of the browser itself.

This is where knowledge of your web app comes in: What does a login request look like for your app? You'll emulate that with {% url `cy.request()` request %} directly, instead of filling out a form and submitting it manually.

Let's revisit the example from above:

```js
it('sets auth cookie when logging in via cy.request()', function(){
  // Emulate a proper login post
  cy.request('POST', '/login', { username: 'jane.lane', password: 'password123' })
    // Do something with the response, if needed
    .then(function(response){
      // response.body is serialized to JSON
      expect(response.body).to.have.property('name', 'Jane')
  })

  // Cookies still get set by cy.request()
  cy.getCookie('cypress-session-cookie').should('exist')
})
```

If you need help getting started with this, open the dev tools, manually do a form submission, and see what the actually gets sent to and received from the server. Now you can see what to extract into a {% url `cy.request()` request %} call, and how to ensure it worked. Keeping your tests fast depends on it!

{% note info Authentication Recipes %}
Need more guidance about logging in with Cypress? No problem! We've created {% url 'a number of helpful recipes', logging-in %} that explore testing various authentication styles in Cypress.
{% endnote %}

## Preparing and Cleaning Up Test Data

If you're familiar with server-side unit testing, you're probably used to using fixtures or factories to build up state in the database before each test, and cleaning it up after. You may decide you want this flow for your client-side tests, as well. In that case, you'll need to bridge Cypress to your back-end, and again we'll use {% url "`cy.request()`" request %} for this task.

You'll want to add some routes to your application that only exist in the `test` environment so that you know they never exist in production. These routes simply take commands about the data you want to test against, bridging over to your fixtures and factories, or your "clear the data store" mechanism.

You might use this with the login advice above to create a user in the database before you log in, allowing you to skip the signup flow step (particularly useful for skipping email confirmation if you require it before the first login!) It's also easy to imagine building up different quantities of your business objects for testing the {% url "5 states of any user interface element: empty, partial, full, loading, and error." http://scotthurff.com/posts/why-your-user-interface-is-awkward-youre-ignoring-the-ui-stack %}

## Isolation from the Back-end with Network Stubbing

One final strategy that Cypress enables is complete isolation from your server via route stubbing. This is an absolute ninja trick, especially for web projects that have already separated their front-ends from their back-ends: separate repositories that get deployed to completely different places and only communicate over HTTP(S).

Cypress anticipates these kinds of projects and enables network stubbing via the {% url "`cy.server()`" server %} and {% url "`cy.route()`" route %} commands. You can declare the API calls you expect your application to make, then capture them before they hit the network and provide your own custom responses.

Since it skips the network and all of the code on the server, _this is fast_. It's also easier to maintain, as your tests can live with your front-end project and never need to coordinate spinning up a development server for another project. {% url "Continuous Integration" continuous-integration %} is simpler because it doesn't need to package up the API server project. All of the login logic is simplified because it is no longer coordinating with the back-end, but rather reacting to canned responses.

# Running Headlessly

While you'll find yourself working primarily in the GUI, it is helpful to be able to run your tests headlessly.

Once you have the {% url "Cypress CLI Tool installed" command-line#cypress-install %}, you can simply execute:

```shell
cypress run
```

Additionally you can specify:

- A single test file to run.
- {% url "A specific reporter and reporter options" reporters %}
- A different port to run tests from.
- Environment variables

You can {% url "read about all of these options" command-line#cypress-run %} which are documented on the CLI tool.

# Get Started!

Ok, we're done talking for now, dive in and test your app! From here you may want to have a look at the {% url "Cypress API" api %} to learn what commands are available as you work. Once you've written a few tests, {% url "Introduction to Cypress" introduction-to-cypress %} is a must-read: it will teach you how Cypress _really_ works, and how to write effective Cypress tests.
