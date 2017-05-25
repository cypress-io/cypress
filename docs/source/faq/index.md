---
layout: plain
title: FAQ
comments: false
containerClass: faq
---

# General Questions

## What is Cypress?


## Hasn’t this been done before?


## Is Cypress free?

Cypress desktop app and CLI are free to use. The Cypress Dashboard is a premium feature for non-open source projects and offers recording videos, screenshots and logs in a web interface.

## What operating systems do you support?

The desktop application can be installed in OSX and Linux. Windows is not yet supported, although you can use Cypress if you install a Linux VM using something like VirtualBox or using a Docker image.

## Do you support native mobile apps?

Cypress would never be able to run on a native mobile app, but would be able to run in a web view. In that mode, you'd see the commands display in a browser while you would drive the mobile device separately. Down the road we'll likely have first class support for this, but today it is not a current priority.

Currently you can control the [`.viewport()`](https://on.cypress.io/viewport) to test responsive, mobile views in a website or web application.

## Do you support X language or X framework?

Cypress tests anything that runs in the context of a browser. It is backend, front-end, language and framework agnostic.

Your actual test code, however does need to be written in JavaScript (or a language that transpiles into JavaScript).

## Will Cypress work in my CI provider?

Cypress works in any CI provider.

## What are good use cases for Cypress?


## What are bad use cases for Cypress?


## Is there code coverage?

There is nothing currently built into Cypress to do this. Adding code coverage around end to end tests is much harder than unit and its possible it may not be feasible to do in a generic way. You can read in more detail about code coverage [here](https://github.com/cypress-io/cypress/issues/346).

## What kind of tests do I write in Cypress?


## Does Cypress use Selenium / Webdriver?

No. In fact Cypress' architecture is very different from Selenium in a few critical ways:

- Cypress runs in the context of the browser. With Cypress it's much easier to accurately test the browser, but harder to talk to the outside work. In Selenium it's the exact opposite. Although Cypress has a few commands that give you access to the outside world - like [.request()](http://on.cypress.io/request) and [.exec()](https://on.cypress.io/exec).

## Are there driver bindings in my language?

Cypress does *not* utilize WebDriver for testing, so does not use or have any notion of driver bindings.

## Does Cypress have an equivalent to Selenium IDE?



## Is Cypress open source?



## How can I contribute to Cypress?


## I found a bug! What do I do?

- Search existing [open issues](https://github.com/cypress-io/cypress/issues), it may already be reported!
- Update Cypress. Your issue may have [already been fixed](https://github.com/cypress-io/cypress/wiki/changelog).
- [Open an issue](https://github.com/cypress-io/cypress/issues/new). Your best chance of getting a bug looked at quickly is to provide a repository with a reproducible bug that can be cloned and run.

# Using Cypress

## How do I wait for an element not to exist?



## How do I do different things depending on what’s currently in the dom/url/cookies/localstore?


## How can I parallelize my runs?

You can read more about parallelization [here](https://github.com/cypress-io/cypress/issues/64).

## Can I run a single test or group of tests?

You can run a group of tests or a single test by placing an `.only` to a test suite or specific test.

You can run a single test headlessly by passing the `--spec` flag to `cypress run`.

Currently there is no way to specify a group of tests to run headlessly. You can read more [here](https://github.com/cypress-io/cypress/issues/263).

## How do I test uploading a file?

It is possible to upload files in your application but its different based on how you've written your own upload code. You can read more about this [here](https://github.com/cypress-io/cypress/issues/170)

## What is the projectId for?

A `projectId` is added to your `cypress.json` after you setup your project for the Dashboard. This `cypress.json` is meant to be checked into source control.

The `projectId` identifies your project in the [Dashboard](https://on.cypress.io/dashboard), which gives you valuable insight into CI runs and failure and debugging info.

You can forgo the projectId and CI keys altogether by running `cypress run` headlessly, but then you're basically opting out of the Dashboard and all its goodies.


## How do I get the native DOM reference of an element found using Cypress?

Cypress wraps elements in jQuery so you'd just get the native element from there.

```javascript
cy.get('button').then(($el) => {
  $el.get(0)
})
```

## How do I make Cypress wait for an XHR request?



## How do I wait for multiple XHR requests to the same url?

You should set up an alias (using [`.as()`](https://on.cypress.io/api/as)) to a single route that matches all of the XHRs. You can then [`.wait()`](https://on.cypress.io/wait) on it multiple times and Cypress keeps track of how many matching XHR requests there are.

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

## How do I seed / reset my database?

You can use either [`.request()`](https://on.cypress.io/request) or [`cy.exec`](https://on.cypress.io/exec) to talk to your backend to seed data.

You could also just stub XHR requests directly using [`.route()`](https://on.cypress.io/route) which avoids ever even needing to fuss with your database.

## How do I pass data to my webserver from Cypress?



## How do I test content inside an iframe?

Currently Cypress does not support selecting or accessing elements from within an iframe. You can read more about this [#here](https://github.com/cypress-io/cypress/issues/136).

## How do I preserve cookies/localstorage in between my tests?

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

## Some of my elements animate in, how do I work around that?

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

## Can I test anchor links that open in a new tab?

Cypress does not and may never have multi-tab support for various reasons.

Luckily there are lots of easy and safe workarounds that enable you to test the behavior of your application

[Read through this recipe to see how to test anchor links.](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/tab_handling_anchor_links_spec.js)


## How do I run my tests in another browser?


## Where do I get the key to run my tests in CI?


## Can I create more than one key for CI?


## I have an app that needs to be tested across multiple user sessions, like a chat app across 2 browsers. How do I test that?


## I want to test clicking a link that navigates, how do I wait and check the resulting location url?


## Is there a way to watch for an xhr request and assert that the response code came back a certain way?


## I’m running a lot of tests that appear to slow down as they run, is there a way to fix this?

## How do I get an input's value in Cypress?

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

## How do I make conditional based assertions / control flow?

## How do I require "" node module in Cypress?

The code you write in Cypress is executed in the browser, so you can import or require JS modules, but only those that work in the browser.

Cypress doesn't have direct access to node or your file system. We recommend utilizing [`.exec()`](https://on.cypress.io/exec) to execute a shell command or a node script that will do what you need.

## Is there a way to give a proper SSL certificate to your proxy so the page doesn't show up as "not secure"?

No, Cypress modifies network traffic in real time and therefore must sit between your server and the browser. There is no other way for us to achieve that.

## Can I use the Page Object pattern?

As far as page objects are concerned, you should be able to use regular JavaScript functions and aliasing with [`.as()`](https://on.cypress.io/as) to essentially recreate what page objects give you.


# Dashboard

## What is the Dashboard?



## How much does it cost?



## What does Cypress record?



## How many recordings can I store?



## Can't I just record my app running, without the Cypress runner?



## Can I see the mouse movements in my recorded video?



## Is there a way to see console logs or application errors in a recorded run?



## Is it possible to transfer a project to an organization I'm not a member of?



## Why are my tests displaying a “still running”?



## Is there any way to remove a run and the data from the Dashboard?



## How secure is storing my test runs (videos and screenshots) on your servers?


# Company

## Who’s behind Cypress?

You can read more about who's behind Cypress on our [here](https://www.cypress.io/about).

## Are you hiring?

You can check our open positions [here](https://www.cypress.io/jobs).
