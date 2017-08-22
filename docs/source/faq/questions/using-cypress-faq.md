---
layout: toc-top
title: Using Cypress
comments: false
containerClass: faq
---

## {% fa fa-angle-right %} How can I parallelize my runs?

You can read more about parallelization {% issue 64 'here' %}.

## {% fa fa-angle-right %} Can I run a single test or group of tests?

You can run a group of tests or a single test by placing an {% url `.only` writing-and-organizing-tests#Excluding-and-Including-Tests %} on a test suite or specific test.

You can run a single test file headlessly by passing the `--spec` flag to {% url '`cypress run`' command-line#cypress-run %}.

Currently there is no way to specify a group of test files to run headlessly. You can read more {% issue 263 'here' %}.

## {% fa fa-angle-right %} How do I test uploading a file?

It is possible to upload files in your application but it's different based on how you've written your own upload code. You can read more about this {% issue 170 'here' %}

## {% fa fa-angle-right %} What is the projectId for?

Once you {% url "setup your tests to record" runs-dashboard %}, we generate a unique `projectId` for your project and automatically insert it into your `cypress.json` file.

***The `projectId` is a 6 character string in your cypress.json:***

```json
{
  "projectId": "a7bq2k"
}
```

This is how we uniquely identify your project. If you manually alter this, *Cypress will no longer be able to identify your project or find the recorded tests for it*. We recommend that you check your `cypress.json`, including the `projectId`, into source control.

## {% fa fa-angle-right %} What is a Record Key?

Once you're {% url "setup to record test runs" runs-dashboard %}, we automatically generate a *Record Key* for the project.

***A record key is a GUID that looks like this:***

```text
f4466038-70c2-4688-9ed9-106bf013cd73
```

{% note info  %}
You can create multiple Record Keys for a project, or delete existing ones from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.
{% endnote %}

You can also find your Record Key inside of the *Settings* tab in our Desktop Application.

![Settings Tab of Desktop](/img/dashboard/record-key-shown-in-desktop-gui-configuration.png)

## {% fa fa-angle-right %} How do I get the native DOM reference of an element found using Cypress?

Cypress wraps elements in jQuery so you'd just get the native element from there within a {% url "`.then()`" then %} command.

```javascript
cy.get('button').then(($el) => {
  $el.get(0)
})
```

## {% fa fa-angle-right %} How do I wait for multiple XHR requests to the same url?

You should set up an alias (using {% url `.as()` as %}) to a single {% url `cy.route()` route %} that matches all of the XHRs. You can then {% url `cy.wait()` wait %} on it multiple times. Cypress keeps track of how many matching XHR requests there are.

```javascript
cy.server()
cy.route('users').as('getUsers')
cy.wait('@getUsers')  // Wait for first GET to /users/
cy.get('#list>li').should('have.length', 10)
cy.get('#load-more-btn').click()
cy.wait('@getUsers')  // Wait for second GET to /users/
cy.get('#list>li').should('have.length', 20)
```

## {% fa fa-angle-right %} How do I seed / reset my database?

You can use either {% url `cy.request()` request %} or {% url `cy.exec()` exec %} to talk to your backend to seed data.

You could also just stub XHR requests directly using {% url `cy.route()` route %} which avoids ever even needing to fuss with your database.

## {% fa fa-angle-right %} How do I test content inside an iframe?

Currently Cypress does not support selecting or accessing elements from within an iframe. You can read more about this {% issue 136 'here' %}.

## {% fa fa-angle-right %} How do I preserve cookies / localStorage in between my tests?

By default, Cypress automatically {% url "clears all cookies **before** each test" clearcookies %} to prevent state from building up.

You can whitelist specific cookies to be preserved across tests using the {% url "Cypress.Cookies api" cookies %}:

```javascript
// now any cookie with the name 'session_id' will
// not be cleared before each test runs
Cypress.Cookies.defaults({
  whitelist: "session_id"
})
```

You can **not** currently preserve localStorage across tests and can read more {% issue 461 'here' %}.

## {% fa fa-angle-right %} Some of my elements animate in, how do I work around that?

Oftentimes you can usually account for animation by asserting {% url "`.should('be.visible')`" should %} or {% url "another assertion" introduction-to-cypress#Assertions %} on one of the elements you expect to be animated in.

```javascript
// assuming a click event causes the animation
cy.get('.element').click().should('not.have.class', 'animating')
```

If the animation is especially long, you could extend the time Cypress waits for the assertion to pass by increasing the `timeout` of the previous command before the assertion.

```javascript
cy.get('button', { timeout: 10000 }) // wait up to 10 seconds for this 'button' to exist
    .should('be.visible')            // and to be visible

cy.get('.element').click({ timeout: 10000 }).should('not.have.class', 'animating')
// wait up to 10 seconds for the .element to not have 'animating' class
```

## {% fa fa-angle-right %} Can I test anchor links that open in a new tab?

Cypress does not and may never have multi-tab support for various reasons.

Luckily there are lots of easy and safe workarounds that enable you to test this behavior in your application.

{% url 'Read through this recipe to see how to test anchor links.' testing-the-dom-recipe %}


## {% fa fa-angle-right %} How do I get an input's value in Cypress?

DOM elements yielded in Cypress are just jQuery elements so you can use any method available in jQuery. Below are some examples of working with an input's value.

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

## {% fa fa-angle-right %} How do I require X node module in Cypress?

The code you write in Cypress is executed in the browser, so you can import or require JS modules, *but* only those that work in a browser.

Cypress doesn't have direct access to node or your file system. We recommend utilizing {% url `cy.exec()` exec %} to execute a shell command or a node script that will do what you need.

## {% fa fa-angle-right %} Is there a way to give a proper SSL certificate to your proxy so the page doesn't show up as "not secure"?

No, Cypress modifies network traffic in real time and therefore must sit between your server and the browser. There is no other way for us to achieve that.

## {% fa fa-angle-right %} Can I use the Page Object pattern?

As far as page objects are concerned, you should be able to use regular JavaScript functions and aliasing with {% url `.as()` as %} to essentially recreate what page objects give you.

## {% fa fa-angle-right %} Is there any way to detect if my app is running under Cypress?

You can check for the existence of `window.Cypress`, for example:

```javascript
if (window.Cypress) {
  window.env = 'test'
} else {
  window.env = '{{env.NODE_ENV}}'
}
```

## {% fa fa-angle-right %} Do you allow before, beforeEach, after, or afterEach hooks?

Yes. You can read more {% url "here" writing-and-organizing-tests#Hooks %}.

## {% fa fa-angle-right %} I tried to install Cypress in my CI, but I get the error: `EACCES: permission denied`.

First, make sure you have {% url "`node`" https://nodejs.org %} installed on your system. `npm` is a `node` package that is installed globally by default when you install node and is required to install our {% url "`cypress` npm  package" command-line %}.

Next, you'd want to check that you have the proper permissions for installing on your system or you may need to run `sudo npm install cypress`.

## {% fa fa-angle-right %} Is there a way to test that a file got downloaded? I want to test that a button click triggers a download.

There are a lot of ways to test this, so it depends. You'll need to be aware of what actually causes the download, then think of a way to test that mechanism.

If your server sends specific disposition headers which cause a browser to prompt for download, you can figure out what URL this request is made to, and use {% url "cy.request()" request %} to hit that directly. Then you can test that the server send the right response headers.

If it's just an anchor that initiates the download, you could just test that it has the right `href` property. As long as you can verify that clicking the button is going to make the right HTTP request, there's nothing else to test for.

In the end, it's up to you to know your implementation and to test just enough to cover everything.

## {% fa fa-angle-right %} Is is possible to catch the promise chain in Cypress?

No. You cannot add a `.catch` error handler to a failed command. {% url "Read more about how the Cypress commands are not Promises" introduction-to-cypress#Commands-Are-Not-Promises %}

## {% fa fa-angle-right %} Is there a way to modify the screenshots/video resolution?

Not at the moment. {% issue 587 "There is an open issue for this." %}

## {% fa fa-angle-right %} Does Cypress support ES7?

Not currently. It uses {% url "browserify" http://browserify.org/ %} and {% url "babelify" https://github.com/babel/babelify %} with the presets/plugins are hard-coded. {% issue 343 "There is an open issue for making this configurable." %}

## {% fa fa-angle-right %} How does one determine what the latest version of Cypress is?

There are a few ways.

- The easiest way is probably to check our {% url "changelog" changelog %}.
- You can also check the latest version {% url "here" https://download.cypress.io/desktop.json %}.
- Once we're open source (soon!), we'll have it tagged in the {% url "repo" https://github.com/cypress-io/cypress %}.

## {% fa fa-angle-right %} Is there an ESLint plugin for Cypress or a list of globals?

`describe/it/beforeEach`, etc globals come from {% url "Mocha" https://mochajs.org/ %}. So you can use ESLint plugins for Mocha like {% url "this one" https://www.npmjs.com/package/eslint-plugin-mocha %}.

## When I visit my site directly, the certificate is verified, however the browser launched through Cypress is showing it as "Not Secure". Why?

This is normal. Cypress modifies the traffic between your server and the browser. The browser notices this and displays a certificate warning. However, this is purely cosmetic and does not alter the way your application under test runs in any way, so you can safely ignore this warning.

## Is there an option to run Cypress with DevTools open? We want to track network and console issues.

No. This is definitely the motivation behind {% issue 448 "this open issue" %}, but there is not a way to run Cypress headlessly with DevTools open.

You may try running the tests locally and {% url "select the Electron browser" launching-browsers#Electron-Browser %}, that's as close as you'll get with DevTools open and replicating the environment that was run headlessly.
