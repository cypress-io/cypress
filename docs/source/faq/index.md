---
layout: faq
title: FAQ
comments: false
containerClass: faq
---

# General Questions

<!-- ## What is Cypress? -->


<!-- ## Hasn’t this been done before? -->

## {% fa fa-question-circle green %} How is this different from 'X' testing tool?

Cypress is kind of a hybrid application/framework/service all rolled into one. It takes a little bit of other testing tools, brings them together and improves on them.

**Mocha**

[Mocha](http://mochajs.org/) is a testing framework for JavaScript. Mocha gives you the `it`, `describe`, `beforeEach` methods. Cypress isn't **different** from Mocha, it actually **uses** Mocha under the hood. All of your tests will be written on top of Mocha's `bdd` interface.

**Karma**

[Karma](http://karma-runner.github.io/) is a unit testing runner for JavaScript, which can work with either `Jasmine`, `Mocha`, or another JavaScript testing framework.

Karma also watches your JavaScript files, live reloads when they change, and is also the `reporter` for your tests failing / passing. It runs from the command line.

Cypress essentially replaces Karma because it does all of this already and much more.

**Capybara**

[Capybara](http://teamcapybara.github.io/capybara/) is a `Ruby` specific tool that allows you to write integration tests for your web application. In the Rails world, this is the *go-to* tool for testing your application. It uses `Selenium` (or another headless driver) to interact with browsers. It's API consists of commands that query for DOM elements, perform user actions, navigate around, etc.

Cypress essentially replaces Capybara because it does all of these things and much more. The difference is that instead of testing your application in a GUI-less console, you'd see your application at all times. You'd never have to take a screenshot to debug because all commands instantly provide you the state of your application while they run. Upon any command failing, you'll get a human-readable error explaining why it failed. There's no "guessing" when debugging.

Oftentimes Capybara begins to not work as well in complex JavaScript applications. Additionally, trying to TDD your application is often difficult. You often have to resort to writing your application code first (typically manually refreshing your browser after changes) until you get it working. From there you write tests, but lose the entire value of TDD.

**Protractor**

[Protractor](http://www.protractortest.org/) is basically the `Capybara` of the JavaScript world. It provides a nice Promise-based interface on top of Selenium, which makes it easy to deal with asynchronous code. Protractor comes with all of the features of Capybara and essentially suffers from the same problems.

Cypress replaces Protractor because it does all of these things and much more. One major difference is that Cypress enables you to write your unit tests and integration tests in the same tool, as opposed to splitting up this work across both Karma and Protractor.

Also, Protractor is very much focused on `AngularJS`, whereas Cypress is designed to work with any JavaScript framework. Protractor, because it's based on Selenium, is still pretty slow, and is prohibitive when trying to TDD your application. Cypress, on the other hand, runs at the speed your browser and application are capable of serving and rendering, there is no additional bloat.

**SauceLabs**

[SauceLabs](https://saucelabs.com/) is a 3rd party tool which enables Selenium-based tests to be run across various browsers and operating systems. Additionally, they have a JavaScript Unit Testing tool that isn't Selenium focused.

SauceLabs also has a `manual testing` mode, where you can remotely control browsers in the cloud as if they were installed on your machine.

Cypress's API is written to be completely compatible with SauceLabs, even though our API is not Selenium based at all. We will be offering better integration with SauceLabs in the future.

Ultimately SauceLabs and Cypress offer very different value propositions. SauceLabs doesn't help you write your tests, it takes your existing tests and runs them across different browsers and aggregates the results for you.

Cypress on the other hand **helps** you write your tests. You would use Cypress every day, building and testing your application, and then use SauceLabs to ensure your application works on every browser.

## {% fa fa-question-circle green %} Is Cypress free?

Cypress desktop app and CLI are free to use. The Cypress Dashboard is a premium feature for non-open source projects and offers recording videos, screenshots and logs in a web interface.

## {% fa fa-question-circle green %} What operating systems do you support?

The desktop application can be installed in OSX and Linux. [Windows is not yet supported](https://github.com/cypress-io/cypress/issues/74), although you can use Cypress if you install a Linux VM using something like VirtualBox or using a Docker image.

## {% fa fa-question-circle green %} Do you support native mobile apps?

Cypress would never be able to run on a native mobile app, but would be able to run in a web view. In that mode, you'd see the commands display in a browser while you would drive the mobile device separately. Down the road we'll likely have first class support for this, but today it is not a current priority.

Currently you can control the {% url `cy.viewport()` viewport %} to test responsive, mobile views in a website or web application.

## {% fa fa-question-circle green %} Do you support X language or X framework?

Any and all. Ruby, Node, C#, PHP - none of that matters. Cypress tests anything that runs in the context of a browser. It is backend, front-end, language and framework agnostic.

You'll write your tests in JavaScript, but beyond that Cypress works everywhere.

## {% fa fa-question-circle green %} Will Cypress work in my CI provider?

Cypress works in any CI provider.

## {% fa fa-question-circle green %} Does Cypress require me to change any of my existing code?

No. But if you're wanting to test parts of your application that are not easily testable, you'll want to refactor those situations (as you would for any testing).

## {% fa fa-question-circle green %} If Cypress runs in the browser, doesn't that mean it's sandboxed?

Yes, technically; it's sandboxed and has to follow the same rules as every other browser. That's actually a good thing because it doesn't require a browser extension, and it naturally will work across all browsers (which enables cross-browser testing).

But Cypress is actually way beyond just a basic JavaScript application running in the browser. It's also a Desktop Application and communicates with backend web services.

All of these technologies together are coordinated and enable Cypress to work, which extends its capabilities far outside of the browser sandbox. Without these, Cypress would not work at all. For the vast majority of your web development, Cypress will work just fine, and already **does** work.

## {% fa fa-question-circle green %} We use WebSockets, will Cypress work with that?

Yes.

<!-- ## What are good use cases for Cypress? -->


<!-- ## What are bad use cases for Cypress? -->

## {% fa fa-question-circle green %} We have the craziest most insane authentication system ever, will Cypress work with that?

If you're using some crazy thumb-print, retinal-scan, time-based, key-changing, microphone audial decoding mechanism to log in your users, then no, Cypress won't work with that.  But seriously, Cypress is a **development** tool, which makes it easy to test your web applications. If your application is doing 100x things to make it extremely difficult to access, Cypress won't magically make it any easier.

Because Cypress is a development tool, you can always make your application more accessible while in your development environment. If you want, simply disable crazy steps in your authentication systems while you're in your testing environment. After all, that's why we have different environments! Normally you already have a development environment, a testing environment, a staging environment, and a production environment.  So simply expose the parts of your system you want accessible in each appropriate environment.

In doing so, Cypress may not be able to give you 100% coverage without you changing anything, but that's okay. Just use different tools to test the crazier, less accessible parts of your application, and let Cypress test the other 99%.

Just remember, Cypress won't make a non-testable application suddenly testable. It's on your shoulders to architect your code in an accessible manner.

## {% fa fa-question-circle green %} Can I use Cypress to script user-actions on an external site like `gmail.com`?

No. There are already lots of tools to do that. Using Cypress to test against a 3rd party application is not supported. It **may** work but will defeat the purpose of why it was created. You use Cypress *while* you develop **your** application, it helps you write your tests.

## {% fa fa-question-circle green %} Is there code coverage?

There is nothing currently built into Cypress to do this. Adding code coverage around end to end tests is much harder than unit and its possible it may not be feasible to do in a generic way. You can read in more detail about code coverage [here](https://github.com/cypress-io/cypress/issues/346).

<!-- ## What kind of tests do I write in Cypress? -->


## {% fa fa-question-circle green %} Does Cypress use Selenium / Webdriver?

No. In fact Cypress' architecture is very different from Selenium in a few critical ways:

- Cypress runs in the context of the browser. With Cypress it's much easier to accurately test the browser, but harder to talk to the outside work. In Selenium it's the exact opposite. Although Cypress has a few commands that give you access to the outside world - like {% url `cy.request()` request %} and {% url `cy.exec()` exec %}.

## {% fa fa-question-circle green %} Are there driver bindings in my language?

Cypress does *not* utilize WebDriver for testing, so does not use or have any notion of driver bindings.

<!-- ## Does Cypress have an equivalent to Selenium IDE? -->

## {% fa fa-question-circle green %} Is Cypress open source?

We are working on open sourcing Cypress. You can read more [here](https://www.cypress.io/blog/2017/05/04/cypress-is-going-open-source/).

<!-- ## How can I contribute to Cypress? -->

## {% fa fa-question-circle green %} I found a bug! What do I do?

- Search existing [open issues](https://github.com/cypress-io/cypress/issues), it may already be reported!
- Update Cypress. Your issue may have [already been fixed](https://github.com/cypress-io/cypress/wiki/changelog).
- [Open an issue](https://github.com/cypress-io/cypress/issues/new). Your best chance of getting a bug looked at quickly is to provide a repository with a reproducible bug that can be cloned and run.

# Using Cypress

<!-- ## How do I wait for an element not to exist? -->



<!-- ## How do I do different things depending on what’s currently in the dom/url/cookies/localstore? -->


## {% fa fa-question-circle green %} How can I parallelize my runs?

You can read more about parallelization [here](https://github.com/cypress-io/cypress/issues/64).

## {% fa fa-question-circle green %} Can I run a single test or group of tests?

You can run a group of tests or a single test by placing an `.only` to a test suite or specific test.

You can run a single test headlessly by passing the `--spec` flag to {% url '`cypress run`' cli-tool#cypress-run %}.

Currently there is no way to specify a group of tests to run headlessly. You can read more [here](https://github.com/cypress-io/cypress/issues/263).

## {% fa fa-question-circle green %} How do I test uploading a file?

It is possible to upload files in your application but its different based on how you've written your own upload code. You can read more about this [here](https://github.com/cypress-io/cypress/issues/170)

## {% fa fa-question-circle green %} What is the projectId for?

Once you setup your project to record, we generate a unique `projectId` for your project, and automatically insert it into your `cypress.json` file.

**The `projectId` is a 6 character string in your cypress.json:**

```json
{
  "projectId": "a7bq2k"
}
```

This is how we uniquely identify your project. If you manually alter this, **Cypress will no longer be able to identify your project or find the recorded builds for it**. We recommend that you check your `cypress.json` including the `projectId` into source control.

## {% fa fa-question-circle green %} What is a Record Key?

Once you're setup to record test runs, we automatically generate a **Record Key** for the project.

**A record key is a GUID that looks like this:**

```shell
f4466038-70c2-4688-9ed9-106bf013cd73
```

{% note info  %}
You can create multiple Record Keys for a project, or delete existing ones from our [Dashboard](https://on.cypress.io/dashboard).
{% endnote %}

You can also find your Record Key inside of the **Settings** tab.

![screen shot 2017-02-12 at 4 12 40 pm](https://cloud.githubusercontent.com/assets/1268976/22866094/64aeeb3e-f13e-11e6-93f5-f7420892913f.png)


## {% fa fa-question-circle green %} How do I get the native DOM reference of an element found using Cypress?

Cypress wraps elements in jQuery so you'd just get the native element from there.

```javascript
cy.get('button').then(($el) => {
  $el.get(0)
})
```

<!-- ## How do I make Cypress wait for an XHR request? -->

## {% fa fa-question-circle green %} How do I wait for multiple XHR requests to the same url?

You should set up an alias (using {% url `.as()` as %}) to a single route that matches all of the XHRs. You can then {% url `cy.wait()` wait %} on it multiple times and Cypress keeps track of how many matching XHR requests there are.

```javascript
cy.server()
cy.route('users').as('getUsers')
cy.wait('@getUsers')  // Wait for first GET to /users/
cy.get('#list>li').should('have.length', 10)
cy.get('#load-more-btn').click()
cy.wait('@getUsers')  // Wait for second GET to /users/
cy.get('#list>li').should('have.length', 20)
```

<!-- ## How do I test drag-n-drop? -->

## {% fa fa-question-circle green %} How do I seed / reset my database?

You can use either {% url `cy.request()` request %} or {% url `cy.exec()` exec %} to talk to your backend to seed data.

You could also just stub XHR requests directly using {% url `cy.route()` route %} which avoids ever even needing to fuss with your database.

<!-- ## How do I pass data to my webserver from Cypress? -->

## {% fa fa-question-circle green %} How do I test content inside an iframe?

Currently Cypress does not support selecting or accessing elements from within an iframe. You can read more about this [#here](https://github.com/cypress-io/cypress/issues/136).

## {% fa fa-question-circle green %} How do I preserve cookies/localstorage in between my tests?

By default, Cypress automatically clears all cookies **before** each test to prevent state from building up.

You can whitelist specific cookies to be preserved across tests:

```javascript
// now any cookie with the name 'session_id' will
// not be cleared before each test runs
Cypress.Cookies.defaults({
  whitelist: "session_id"
})
```

You cannot currently preserve localStorage across tests and can read more [here](https://github.com/cypress-io/cypress/issues/461).

## {% fa fa-question-circle green %} Some of my elements animate in, how do I work around that?

Oftentimes you can usually account for animation by asserting `.should('be.visible')` or another assertion on one of the elements you expect to be animated in.

```javascript
// assuming a click event causes the animation
cy.get('element').click().should('not.have.class', 'animating')
```

If the animation is especially long, you could extend the time Cypress waits for the assertion to be true by increasing the `timeout`.

```javascript
cy.get('button', { timeout: 10000 }) // <-- wait up to 10 seconds for this 'button' to be found
    .should('be.visible')   // <-- and to be visible

cy.get('element').click({ timeout: 10000 }).should('not.have.class', 'animating')
```

## {% fa fa-question-circle green %} Can I test anchor links that open in a new tab?

Cypress does not and may never have multi-tab support for various reasons.

Luckily there are lots of easy and safe workarounds that enable you to test the behavior of your application

[Read through this recipe to see how to test anchor links.](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/tab_handling_anchor_links_spec.js)


<!-- ## How do I run my tests in another browser? -->


<!-- ## Where do I get the key to run my tests in CI? -->


<!-- ## Can I create more than one key for CI? -->


<!-- ## I have an app that needs to be tested across multiple user sessions, like a chat app across 2 browsers. How do I test that? -->


<!-- ## I want to test clicking a link that navigates, how do I wait and check the resulting location url? -->


<!-- ## Is there a way to watch for an xhr request and assert that the response code came back a certain way? -->


<!-- ## I’m running a lot of tests that appear to slow down as they run, is there a way to fix this? -->

## {% fa fa-question-circle green %} How do I get an input's value in Cypress?

 Cypress DOM elements are just jQuery elements so you can use any method available in jQuery. Below are some examples of working with an input's value.

 ```javascript
cy.get('input').invoke('val').then((val) => {
  // do something with value here
})

cy.get('input').then(($input) => {
  // do something with value here
  $input.val()
})

// make an assertion on the value
cy.get('input').should('have.value', 'abc')
 ```

<!-- ## {% fa fa-question-circle green %} How do I make conditional based assertions / control flow? -->

## {% fa fa-question-circle green %} How do I require "" node module in Cypress?

The code you write in Cypress is executed in the browser, so you can import or require JS modules, but only those that work in the browser.

Cypress doesn't have direct access to node or your file system. We recommend utilizing {% url `cy.exec()` exec %} to execute a shell command or a node script that will do what you need.

## {% fa fa-question-circle green %} Is there a way to give a proper SSL certificate to your proxy so the page doesn't show up as "not secure"?

No, Cypress modifies network traffic in real time and therefore must sit between your server and the browser. There is no other way for us to achieve that.

## {% fa fa-question-circle green %} Can I use the Page Object pattern?

As far as page objects are concerned, you should be able to use regular JavaScript functions and aliasing with {% url `.as()` as %} to essentially recreate what page objects give you.


# Dashboard

## {% fa fa-question-circle green %} What is the Dashboard?

![Dashboard Screenshot](https://cloud.githubusercontent.com/assets/1271364/22800284/d4dbe1d8-eed6-11e6-87ce-32474ea1000c.png)

[The Dashboard](https://on.cypress.io/dashboard) is a Cypress service that gives you access to tests you've recorded - typically when running Cypress tests from your CI provider. The Dashboard provides you insight into what happened during your run.

You can read more [here](https://on.cypress.io/guides/dashboard-features).

## {% fa fa-question-circle green %} How do I record my tests?

1. First [setup your project to record](https://on.cypress.io/recording-project-runs).
2. Then [record your runs](https://on.cypress.io/how-do-i-record-runs).

After recording your tests, you will see them in the Dashboard and in the Desktop Application.

## {% fa fa-question-circle green %} How much does it cost?

Everything is free while we are in Beta.

In the future, we will charge per month for private projects.

Public projects will be free but will likely have a monthly usage cap on them.

We will offer similar pricing models of other Developer Tools you are familiar with using.

## {% fa fa-question-circle green %} How is this different than CI?

Cypress is **complimentary** to your CI provider, and plays a completely different role.

It doesn't replace nor change anything related to CI. You will simply run Cypress tests in your CI provider.

The difference is that your CI provider has no idea what is going on inside of the Cypress process. It's simply programmed to know whether or not a process failed - based on whether it had an exit code greater than `0`.

Our dashboard provides you with the low level details of *what* happened during your run. Using both your CI provider + Cypress together gives the insight required to debug your test runs.

When a run happens and a test fails - instead of going and inspecting your CI provider's `stdout` output, you can log into the [Dashboard](https://on.cypress.io/dashboard) and see all of the test run results. It should be instantly clear what the problem was.

## {% fa fa-question-circle green %} Can I host the Dashboard data myself?

No, although we are looking to build an on-premise version of the Dashboard for use in private clouds. If you're interested in our on-premise version, [let us know](mailto:hello@cypress.io)!

## {% fa fa-question-circle green %} Can I choose not to use the Dashboard?

Of course. The dashboard is a separate service from the Desktop Application and will always remain optional. We hope you'll find a tremendous amount of value out of it, but it is not coupled to being able to run your tests.

You can simply always run your tests in CI using {% url '`cypress run`' cli-tool#cypress-run %} without the `--record` flag which does not communicate with our external servers and will not record any test results.

## {% fa fa-question-circle green %} What is the difference between public and private projects?

**A public project** means that anyone can see the recorded runs for it. It's similar to how public projects on Github, Travis, or Circle are handled. Anyone who knows your `projectId` will be able to see the recorded runs for public projects.

**A private project** means that only [users](https://on.cypress.io/guides/organizations#section-inviting-users) you explicitly invite to your [organization](https://on.cypress.io/guides/organizations) can see its recorded runs. Even if someone knows your `projectId`, they will not have access to your runs unless you have invited them.

A Record Key has nothing to do with **viewing** build data - it's a "write only" key. Even if it is accidentally leaked, it will not affect who can "see" your builds.


## {% fa fa-question-circle green %} What does Cypress record?

We capture the following:

- [Standard Output](#section-standard-output)
- [Test Failures](#section-test-failures)
- [Screenshots](#section-screenshots)
- [Video](#section-video)

We have already begun the implementation for capturing even more things from your run such as:

- Commands
- Network Traffic
- Browser Console Logs

These will be added in subsequent releases.

<!-- ## How many recordings can I store? -->


<!-- ## Can't I just record my app running, without the Cypress runner? -->

<!-- ## Can I see the mouse movements in my recorded video? -->

<!-- ## Is there a way to see console logs or application errors in a recorded run? -->

<!-- ## Is it possible to transfer a project to an organization I'm not a member of? -->

<!-- ## Why are my tests displaying a “still running”? -->

<!-- ## Is there any way to remove a run and the data from the Dashboard? -->

<!-- ## How secure is storing my test runs (videos and screenshots) on your servers? -->

# Company

## {% fa fa-question-circle green %} Who’s behind Cypress?

You can read more about who's behind Cypress on our [here](https://www.cypress.io/about).

## {% fa fa-question-circle green %} Are you hiring?

You can check our open positions [here](https://www.cypress.io/jobs).
