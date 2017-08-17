---
layout: toc-top
title: General Questions
comments: false
containerClass: faq
---

## {% fa fa-angle-right %} How is this different from 'X' testing tool?

Cypress is kind of a hybrid application/framework/service all rolled into one. It takes a little bit of other testing tools, brings them together and improves on them.

***Mocha***

 Mocha is a testing framework for JavaScript. {% url "Mocha" http://mochajs.org/ %} gives you the `it`, `describe`, `beforeEach` methods. Cypress isn't **different** from Mocha, it actually **uses** Mocha under the hood. All of your tests will be written on top of Mocha's `bdd` interface.

***Karma***

A unit testing runner for JavaScript, {% url "Karma" http://karma-runner.github.io/ %}, works with either {% url "Jasmine" https://jasmine.github.io/ %}, {% url "Mocha" http://mochajs.org/ %}, or any other JavaScript testing framework.

Karma also watches your JavaScript files, live reloads when they change, and is also the `reporter` for your tests failing / passing. It runs from the command line.

Cypress essentially replaces Karma because it does all of this already and much more.

***Capybara***

The a `Ruby` specific tool that allows you to write integration tests for your web application is {% url "Capybara" http://teamcapybara.github.io/capybara/ %}. In the Rails world, this is the *go-to* tool for testing your application. It uses {% url "SauceLabs" https://saucelabs.com/ %} (or another headless driver) to interact with browsers. It's API consists of commands that query for DOM elements, perform user actions, navigate around, etc.

Cypress essentially replaces Capybara because it does all of these things and much more. The difference is that instead of testing your application in a GUI-less console, you'd see your application at all times. You'd never have to take a screenshot to debug because all commands instantly provide you the state of your application while they run. Upon any command failing, you'll get a human-readable error explaining why it failed. There's no "guessing" when debugging.

Oftentimes Capybara begins to not work as well in complex JavaScript applications. Additionally, trying to TDD your application is often difficult. You often have to resort to writing your application code first (typically manually refreshing your browser after changes) until you get it working. From there you write tests, but lose the entire value of TDD.

***Protractor***

Using {% url "Protractor" http://www.protractortest.org/ %} provides a nice Promise-based interface on top of Selenium, which makes it easy to deal with asynchronous code. Protractor comes with all of the features of Capybara and essentially suffers from the same problems.

Cypress replaces Protractor because it does all of these things and much more. One major difference is that Cypress enables you to write your unit tests and integration tests in the same tool, as opposed to splitting up this work across both Karma and Protractor.

Also, Protractor is very much focused on `AngularJS`, whereas Cypress is designed to work with any JavaScript framework. Protractor, because it's based on Selenium, is still pretty slow, and is prohibitive when trying to TDD your application. Cypress, on the other hand, runs at the speed your browser and application are capable of serving and rendering, there is no additional bloat.

***SauceLabs***

Using {% url "SauceLabs" https://saucelabs.com/ %} enables Selenium-based tests to be run across various browsers and operating systems. Additionally, they have a JavaScript Unit Testing tool that isn't Selenium focused.

SauceLabs also has a `manual testing` mode, where you can remotely control browsers in the cloud as if they were installed on your machine.

Cypress's API is written to be completely compatible with SauceLabs, even though our API is not Selenium based at all. We will be offering better integration with SauceLabs in the future.

Ultimately SauceLabs and Cypress offer very different value propositions. SauceLabs doesn't help you write your tests, it takes your existing tests and runs them across different browsers and aggregates the results for you.

Cypress on the other hand **helps** you write your tests. You would use Cypress every day, building and testing your application, and then use SauceLabs to ensure your application works on every browser.

## {% fa fa-angle-right %} Is Cypress free?

Cypress desktop app and CLI are free to use. The Cypress Dashboard is a premium feature for non-open source projects and offers recording videos, screenshots and logs in a web interface.

## {% fa fa-angle-right %} What operating systems do you support?

The desktop application can be {% url "installed" installing-cypress %} in OSX and Linux. {% issue 74 'Windows is not yet supported' %}, although you can use Cypress if you install a Linux VM using something like {% url "VirtualBox" https://www.virtualbox.org/ %} or using a {% url "Docker image" userland-extensions#Docker %}.

## {% fa fa-angle-right %} Do you support native mobile apps?

Cypress would never be able to run on a native mobile app, but would be able to run in a mobile web browser. In that mode, you'd see the commands display in a browser while you would drive the mobile device separately. Down the road we'll likely have first class support for this, but today it is not a current priority.

Currently you can control the viewport with the {% url `cy.viewport()` viewport %} command to test responsive, mobile views in a website or web application.

## {% fa fa-angle-right %} Do you support X language or X framework?

Any and all. Ruby, Node, C#, PHP - none of that matters. Cypress tests anything that runs in the context of a browser. It is backend, front-end, language and framework agnostic.

You'll write your tests in JavaScript, but beyond that Cypress works everywhere.

## {% fa fa-angle-right %} Can I run cypress on another browser other than Chrome?

You can read about our currently available browsers {% url "here" launching-browsers %}.

## {% fa fa-angle-right %} Is it possible to use cypress on `.jspa`?
Yes. Cypress works on anything rendered to a browser.

## {% fa fa-angle-right %} Will Cypress work in my CI provider?

Cypress works in any {% url "CI provider" continuous-integration %}.

## {% fa fa-angle-right %} Does Cypress require me to change any of my existing code?

No. But if you're wanting to test parts of your application that are not easily testable, you'll want to refactor those situations (as you would for any testing).

## {% fa fa-angle-right %} If Cypress runs in the browser, doesn't that mean it's sandboxed?

Yes, technically; it's sandboxed and has to follow the same rules as every other browser. That's actually a good thing because it doesn't require a browser extension, and it naturally will work across all browsers (which enables cross-browser testing).

But Cypress is actually way beyond just a basic JavaScript application running in the browser. It's also a Desktop Application and communicates with backend web services.

All of these technologies together are coordinated and enable Cypress to work, which extends its capabilities far outside of the browser sandbox. Without these, Cypress would not work at all. For the vast majority of your web development, Cypress will work just fine, and already *does* work.

## {% fa fa-angle-right %} We use WebSockets, will Cypress work with that?

Yes.

## {% fa fa-angle-right %} We have the craziest most insane authentication system ever, will Cypress work with that?

If you're using some crazy thumb-print, retinal-scan, time-based, key-changing, microphone, audial, decoding mechanism to log in your users, then no, Cypress won't work with that.  But seriously, Cypress is a *development* tool, which makes it easy to test your web applications. If your application is doing 100x things to make it extremely difficult to access, Cypress won't magically make it any easier.

Because Cypress is a development tool, you can always make your application more accessible while in your development environment. If you want, simply disable crazy steps in your authentication systems while you're in your testing environment. After all, that's why we have different environments! Normally you already have a development environment, a testing environment, a staging environment, and a production environment.  So simply expose the parts of your system you want accessible in each appropriate environment.

In doing so, Cypress may not be able to give you 100% coverage without you changing anything, but that's okay. Just use different tools to test the crazier, less accessible parts of your application, and let Cypress test the other 99%.

Just remember, Cypress won't make a non-testable application suddenly testable. It's on your shoulders to architect your code in an accessible manner.

## {% fa fa-angle-right %} Can I use Cypress to script user-actions on an external site like `gmail.com`?

No. There are already lots of tools to do that. Using Cypress to test against a 3rd party application is not it's intended use. It *may* work but will defeat the purpose of why it was created. You use Cypress *while* you develop your application, it helps you write your tests.

## {% fa fa-angle-right %} Is there code coverage?

There is nothing currently built into Cypress to do this. Adding code coverage around end to end tests is much harder than unit tests and it may not be feasible to do in a generic way. You can read in more detail about code coverage {% issue 346 'here' %}.

## {% fa fa-angle-right %} Does Cypress use Selenium / Webdriver?

No. In fact Cypress' architecture is very different from Selenium in a few critical ways:

- Cypress runs in the context of the browser. With Cypress it's much easier to accurately test the browser, but harder to talk to the outside work. In Selenium it's the exact opposite, it runs outside of the browser where your application is running. Although Cypress has a few commands that give you access to the outside world - like {% url `cy.request()` request %} and {% url `cy.exec()` exec %}.
- With Selenium - aka WebDriver, you either get 100% simulated events (with Selenium RC) or you got 100% native events with Selenium WebDriver. However, with Cypress, you actually get both. For the most part we use simulated events; We can reproduce them with nearly 100% fidelity, they are much faster, and guaranteed to work the same way every time. However we do use automation API's for things like Cookies where we extend outside of the JavaScript sandbox and interact with the underlying browser API's. This gives us flexibility to determine which type of event to use in specific situations. We've yet to add native input events though.

## {% fa fa-angle-right %} Are there driver bindings in my language?

Cypress does *not* utilize WebDriver for testing, so does not use or have any notion of driver bindings.

## {% fa fa-angle-right %} So what benefits would one get for converting one's unit tests from Karma or Jest to Cypress?

Unit tests are not something we are really trying to solve right now. Most of the `cy` API commands are useless in unit tests. The biggest benefit of writing unit tests in Cypress is that they run in a browser, which has debugger support built in.

We have internally experimented at doing DOM based component unit testing in Cypress - and that has the possibility of being an excellent "sweet spot" for unit tests. You'd get full DOM support, screenshot support, snapshot testing, and you could then use other `cy` commands (if need be). But as I mentioned this isn't something we're actively pushing, it just remains a thing that's possible if we wanted to go down that route.

With that said - we actually believe the best form of testing in Cypress is a combination of a "unit test" mixed with an "e2e test". We don't believe in a "hands off" approach. We want you to modify the state of your application, take shortcuts as much as possible (because you have native access to all objects including your app). In other words, we want you to think in unit tests while you write integration tests.

## {% fa fa-angle-right %} Is Cypress open source?

We are working on open sourcing Cypress. You can read more {% url "here" https://www.cypress.io/blog/2017/05/04/cypress-is-going-open-source/ %}.

## {% fa fa-angle-right %} I found a bug! What do I do?

- Search existing {% url "open issues" https://github.com/cypress-io/cypress/issues %}, it may already be reported!
- Update Cypress. Your issue may have {% url "already been fixed" changelog %}.
- {% open_an_issue %}. Your best chance of getting a bug looked at quickly is to provide a repository with a reproducible bug that can be cloned and run.

<!-- ## What is Cypress? -->

<!-- ## Hasn’t this been done before? -->

<!-- ## What are good use cases for Cypress? -->

<!-- ## What are bad use cases for Cypress? -->

<!-- ## What kind of tests do I write in Cypress? -->

<!-- ## Does Cypress have an equivalent to Selenium IDE? -->

<!-- ## How can I contribute to Cypress? -->
