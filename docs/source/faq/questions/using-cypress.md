---
layout: faq
title: Using Cypress
comments: false
containerClass: faq
---

<!-- # How do I wait for an element not to exist? -->



<!-- # How do I do different things depending on what’s currently in the dom/url/cookies/localstore? -->


# {% fa fa-angle-right %} How can I parallelize my runs?

You can read more about parallelization {% issue 64 'here' %}.

# {% fa fa-angle-right %} Can I run a single test or group of tests?

You can run a group of tests or a single test by placing an `.only` to a test suite or specific test.

You can run a single test headlessly by passing the `--spec` flag to {% url '`cypress run`' cli-tool#cypress-run %}.

Currently there is no way to specify a group of tests to run headlessly. You can read more {% issue 263 'here' %}.

# {% fa fa-angle-right %} How do I test uploading a file?

It is possible to upload files in your application but its different based on how you've written your own upload code. You can read more about this {% issue 170 'here' %}

# {% fa fa-angle-right %} What is the projectId for?

Once you setup your project to record, we generate a unique `projectId` for your project, and automatically insert it into your `cypress.json` file.

**The `projectId` is a 6 character string in your cypress.json:**

```json
{
  "projectId": "a7bq2k"
}
```

This is how we uniquely identify your project. If you manually alter this, **Cypress will no longer be able to identify your project or find the recorded builds for it**. We recommend that you check your `cypress.json` including the `projectId` into source control.

# {% fa fa-angle-right %} What is a Record Key?

Once you're setup to record test runs, we automatically generate a **Record Key** for the project.

**A record key is a GUID that looks like this:**

```shell
f4466038-70c2-4688-9ed9-106bf013cd73
```

{% note info  %}
You can create multiple Record Keys for a project, or delete existing ones from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.
{% endnote %}

You can also find your Record Key inside of the **Settings** tab.

![screen shot 2017-02-12 at 4 12 40 pm](https://cloud.githubusercontent.com/assets/1268976/22866094/64aeeb3e-f13e-11e6-93f5-f7420892913f.png)


# {% fa fa-angle-right %} How do I get the native DOM reference of an element found using Cypress?

Cypress wraps elements in jQuery so you'd just get the native element from there.

```javascript
cy.get('button').then(($el) => {
  $el.get(0)
})
```

<!-- # How do I make Cypress wait for an XHR request? -->

# {% fa fa-angle-right %} How do I wait for multiple XHR requests to the same url?

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

<!-- # How do I test drag-n-drop? -->

# {% fa fa-angle-right %} How do I seed / reset my database?

You can use either {% url `cy.request()` request %} or {% url `cy.exec()` exec %} to talk to your backend to seed data.

You could also just stub XHR requests directly using {% url `cy.route()` route %} which avoids ever even needing to fuss with your database.

<!-- # How do I pass data to my webserver from Cypress? -->

# {% fa fa-angle-right %} How do I test content inside an iframe?

Currently Cypress does not support selecting or accessing elements from within an iframe. You can read more about this {% issue 136 '#here' %}.

# {% fa fa-angle-right %} How do I preserve cookies/localstorage in between my tests?

By default, Cypress automatically clears all cookies **before** each test to prevent state from building up.

You can whitelist specific cookies to be preserved across tests:

```javascript
// now any cookie with the name 'session_id' will
// not be cleared before each test runs
Cypress.Cookies.defaults({
  whitelist: "session_id"
})
```

You cannot currently preserve localStorage across tests and can read more {% issue 461 'here' %}.

# {% fa fa-angle-right %} Some of my elements animate in, how do I work around that?

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

# {% fa fa-angle-right %} Can I test anchor links that open in a new tab?

Cypress does not and may never have multi-tab support for various reasons.

Luckily there are lots of easy and safe workarounds that enable you to test the behavior of your application

[Read through this recipe to see how to test anchor links.](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/tab_handling_anchor_links_spec.js)


<!-- # How do I run my tests in another browser? -->


<!-- # Where do I get the key to run my tests in CI? -->


<!-- # Can I create more than one key for CI? -->


<!-- # I have an app that needs to be tested across multiple user sessions, like a chat app across 2 browsers. How do I test that? -->


<!-- # I want to test clicking a link that navigates, how do I wait and check the resulting location url? -->


<!-- # Is there a way to watch for an xhr request and assert that the response code came back a certain way? -->


<!-- # I’m running a lot of tests that appear to slow down as they run, is there a way to fix this? -->

# {% fa fa-angle-right %} How do I get an input's value in Cypress?

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

<!-- # {% fa fa-angle-right %} How do I make conditional based assertions / control flow? -->

# {% fa fa-angle-right %} How do I require "" node module in Cypress?

The code you write in Cypress is executed in the browser, so you can import or require JS modules, but only those that work in the browser.

Cypress doesn't have direct access to node or your file system. We recommend utilizing {% url `cy.exec()` exec %} to execute a shell command or a node script that will do what you need.

# {% fa fa-angle-right %} Is there a way to give a proper SSL certificate to your proxy so the page doesn't show up as "not secure"?

No, Cypress modifies network traffic in real time and therefore must sit between your server and the browser. There is no other way for us to achieve that.

# {% fa fa-angle-right %} Can I use the Page Object pattern?

As far as page objects are concerned, you should be able to use regular JavaScript functions and aliasing with {% url `.as()` as %} to essentially recreate what page objects give you.


# Dashboard

# {% fa fa-angle-right %} What is the Dashboard?

![Dashboard Screenshot](https://cloud.githubusercontent.com/assets/1271364/22800284/d4dbe1d8-eed6-11e6-87ce-32474ea1000c.png)

{% url 'Dashboard' https://on.cypress.io/dashboard %} is a Cypress service that gives you access to tests you've recorded - typically when running Cypress tests from your CI provider. The Dashboard provides you insight into what happened during your run.

You can read more {% url 'here' dashboard-features %}.

# {% fa fa-angle-right %} How do I record my tests?

1. First {% url 'setup the project to record' dashboard-projects#Set-up-a-Project-to-Record %}.
2. Then {% url 'record your runs' dashboard-features#How-do-I-record-my-tests %}.

After recording your tests, you will see them in the Dashboard and in the Desktop Application.

# {% fa fa-angle-right %} How much does it cost?

Everything is free while we are in Beta.

In the future, we will charge per month for private projects.

Public projects will be free but will likely have a monthly usage cap on them.

We will offer similar pricing models of other Developer Tools you are familiar with using.

# {% fa fa-angle-right %} How is this different than CI?

Cypress is **complimentary** to your CI provider, and plays a completely different role.

It doesn't replace nor change anything related to CI. You will simply run Cypress tests in your CI provider.

The difference is that your CI provider has no idea what is going on inside of the Cypress process. It's simply programmed to know whether or not a process failed - based on whether it had an exit code greater than `0`.

Our dashboard provides you with the low level details of *what* happened during your run. Using both your CI provider + Cypress together gives the insight required to debug your test runs.

When a run happens and a test fails - instead of going and inspecting your CI provider's `stdout` output, you can log into the {% url 'Dashboard' https://on.cypress.io/dashboard %} and see all of the test run results. It should be instantly clear what the problem was.

# {% fa fa-angle-right %} Can I host the Dashboard data myself?

No, although we are looking to build an on-premise version of the Dashboard for use in private clouds. If you're interested in our on-premise version, [let us know](mailto:hello@cypress.io)!

# {% fa fa-angle-right %} Can I choose not to use the Dashboard?

Of course. The dashboard is a separate service from the Desktop Application and will always remain optional. We hope you'll find a tremendous amount of value out of it, but it is not coupled to being able to run your tests.

You can simply always run your tests in CI using {% url '`cypress run`' cli-tool#cypress-run %} without the `--record` flag which does not communicate with our external servers and will not record any test results.

# {% fa fa-angle-right %} What is the difference between public and private projects?

**A public project** means that anyone can see the recorded runs for it. It's similar to how public projects on Github, Travis, or Circle are handled. Anyone who knows your `projectId` will be able to see the recorded runs for public projects.

**A private project** means that only {% url 'users' dashboard-organizations#Inviting-Users %} you explicitly invite to your {% url 'organization' dashboard-organizations %} can see its recorded runs. Even if someone knows your `projectId`, they will not have access to your runs unless you have invited them.

A Record Key has nothing to do with **viewing** build data - it's a "write only" key. Even if it is accidentally leaked, it will not affect who can "see" your builds.


# {% fa fa-angle-right %} What does Cypress record?

We capture the following:

- Standard Output
- Test Failures
- Screenshots
- Video

We have already begun the implementation for capturing even more things from your run such as:

- Commands
- Network Traffic
- Browser Console Logs

These will be added in subsequent releases.

<!-- # How many recordings can I store? -->


<!-- # Can't I just record my app running, without the Cypress runner? -->

<!-- # Can I see the mouse movements in my recorded video? -->

<!-- # Is there a way to see console logs or application errors in a recorded run? -->

<!-- # Is it possible to transfer a project to an organization I'm not a member of? -->

<!-- # Why are my tests displaying a “still running”? -->

<!-- # Is there any way to remove a run and the data from the Dashboard? -->

<!-- # How secure is storing my test runs (videos and screenshots) on your servers? -->
