slug: faq
excerpt: Frequently Asked Questions

# What kinds of applications can I test with Cypress?
Cypress was originally designed to be used in modern JavaScript applications, but Cypress works perfectly on traditional server-side HTML based applications as well.

The API scales well in both situations, however there are certain commands which are useful primarily in JavaScript-based applications and won't see much use in traditional server-side applications.

Cypress enables you to pick the best testing strategy. You may choose not to involve the server for most tests (which is a good thing) and mock all requests/responses to and from the server. You may also choose to perform full-blown integration tests, where no data is mocked, and everything goes through the server. The implementation is completely up to you.

# What backend servers is Cypress compatible with?
Any and all. Ruby, Node, C#, PHP, none of that matters. You'll write your tests in Javascript, but beyond that Cypress will work everywhere. To talk directly to your backend from your tests, you will need one of our adapters. Read on for more information on that.

# Does Cypress require me to change any of my existing code?
No. But if you're wanting to test parts of your application which are not easily testable, you'll need to refactor those as you would for any testing.

# How is this different than Mocha, Karma, Capybara, Protractor, SauceLabs, etc?
Cypress is kind of a hybrid application/framework/service all rolled into one. It takes a little bit of each of those tools and brings them all together.

**Mocha** <br>
[Mocha](http://mochajs.org/) is a testing framework for JavaScript. Mocha gives you the `it`, `describe`, `beforeEach` methods. Cypress isn't **different** from Mocha, it actually **uses** Mocha under the hood. All of your tests will be written on top of Mocha's `bdd` interface.

**Karma** <br>
[Karma](http://karma-runner.github.io/) is a unit testing runner for JavaScript, which can work with either `Jasmine`, `Mocha`, or another JavaScript testing framework.

Karma also watches your JavaScript files, live reloads when they change, and is also the `reporter` for your tests failing / passing. It runs from the command line.

Cypress would essentially replace Karma because it does all of this and much more.

**Capybara** <br>
Capybara is a `Ruby` specific tool which allows you to write integration tests for your web application. In the Rails world, this is the *go-to* tool for testing your application. It uses `Selenium` or another headless driver under the hood to interact with browsers. It's API consists of commands which query for DOM elements, perform user actions, navigate around, etc.

Cypress would essentially replace Capybara because it does all of these things, and much more. The difference is that instead of testing your application in a GUI-less console, you'd see your application at all times. You'd never have to take a screenshot to debug because all commands instantly provide you the state of your application when they run. Upon any command failing, you'll get a human-readable error explaining why it failed. There's no "guessing" when debugging.

In my experience, Capybara begins to melt down on complex JavaScript applications. Additionally, trying to TDD your application is virtually impossible. You often have to resort to writing your application code first (typically manually refreshing your browser after changes) until you get it working. From there you write tests, but lose the entire value of TDD. These tests often feel "tacked" on, especially when it becomes harder to write a passing test when you can just open up your browser and see that it is already working.

**Protractor** <br>
Protractor is basically the `Capybara` of the JavaScript world. It provides a nice Promise-based interface on top of Selenium, which makes it easy to deal with async code. Protractor comes with all of the features of Capybara but essentially suffers from the same problems.

Cypress would replace Protractor because it does all of these things and much more. One major difference is that Cypress enables you to write your unit tests and integration tests in the same tool, as opposed to splitting up this work across both Karma and Protractor. Also, Protractor is very much focused on `AngularJS`, whereas Cypress works with all JavaScript frameworks. Protractor, because it's based on Selenium, is still pretty slow, and is prohibitive when trying to TDD your application. Cypress on the other hand will run at the maximum speed your browser and application are capable of serving and rendering, there is no additional bloat.

**SauceLabs** <br>
[SauceLabs](https://saucelabs.com/) is a 3rd party tool which enables Selenium-based tests to be run across various browsers and operating systems. Additionally, they have a JS Unit Testing tool which isn't Selenium focused.

SauceLabs also has a `manual testing` mode, where you can remotely control browsers in the cloud as if they were installed on your machine.

Cypress does not replace SauceLabs, in fact it compliments it. We are currently working on our own manual testing mode for browsers, but it is considerably different than what SauceLabs provides. That is the only overlapping feature.

Cypress's API is written to be completely compatible with SauceLabs, even though our API is not Selenium based at all. At the end of the day, you'll be able to enter your SauceLabs API key directly into Cypress, and  run all of your tests across various browser combinations / operating systems. The results will be made available directly in Cypress.

Ultimately SauceLabs and Cypress offer very different value propositions. SauceLabs doesn't help you write your tests, it takes your existing tests and runs them across different browsers and aggregates the results for you.

Cypress on the other hand **helps** you write your tests. You would use Cypress every day, building and testing your application, and then use SauceLabs to ensure your application works on every browser.

The overlapping feature, **manually testing browsers** is different from a workflow perspective.

Currently, without Cypress, when you get errors from SauceLabs, you would then proceed to **debug** your application in that specific browser. This is where manually testing comes in handy. You could do that from SauceLabs tool, which means you'd navigate to their service and connect to your local server. You could then make a code change, refresh, manually recreate the bug, and debug in the other browser (with the other browser's native debugging tools). This can be tedious and time consuming. After fixing the bug you'd have to rerun your tests across all of the browsers again to see if anything else broke.

With Cypress, you'd still get errors from SauceLabs, but instead of leaving Cypress, you could use Cypress to create a manual session with that failing browser. Once connected to the other browser, you could see the error message in Cypress and proceed to debug it. As you make code changes, all of your Cypress commands would drive the other browser. The end result is that you'd see and debug another browser from within Google Chrome, using the same interface you use while developing locally.

# If Cypress runs in the browser, doesn't that mean it's sandboxed?
Yes, technically; it's sandboxed and has to follow the same rules as every other browser. That's actually a good thing because it doesn't require a browser extension, and it naturally works across all browsers (which enables cross-browser testing).

But Cypress is actually way beyond just a basic JavaScript application running in the browser. That's one part, but it's also a `Desktop Application`, communicates with backend web services, and has language-specific adapters which are installed in your project.

All of these technologies together are coordinated and enable Cypress to work, which extends its capabilities far outside of the browser sandbox. Without these, Cypress would not work at all. While it's possible limitations may arise, these will be the minority. For the vast majority of your web development, Cypress will work just fine, and already **does** work.

# Seriously, I know there are security restrictions for JavaScript running in the browser!
Seriously, Cypress has already solved these issues transparently without it causing you to change anything in your application. Everything should just work. Even clearing all cookies from JavaScript.

# Since Cypress runs in the browser, how can it talk to my backend?
While you'll always write your tests in JavaScript, it's often important to talk to your backend prior to a test running, or throughout a test, or even after a test finishes. Regardless of which type of application you have, or plan to build, Cypress can communicate with the backend through one of its adapters. We are currently building adapters for:

* Rails
* Node
* .NET
* PHP

Each adapter will be made available in each language's package system, and will have separate repositories detailing the installation, configuration, etc. Using these adapters will allow Cypress to pass messages to the backend for things like:

* Querying the database
* Seeding the database
* Requesting specific data
* Asking if emails were sent
* Anything else your backend needs to provide

As is the philosophy of Cypress, using these adapters should be painless and simple to install. Error messages will display directly in the browser and you'll be able to diagnose / debug easily.

These adapters are completely optional and are only necessary if you intend to test end to end with your server. If you only write JavaScript unit tests or mock request/responses you won't need these.

# We use WebSockets, will Cypress work with that?
Yes.

# Will Cypress work for my CI provider?
Yes.

# We have the craziest most insane authentication system ever, will Cypress work with that?
If you're using some crazy thumb-print, retinal-scan, time-based, key-changing, microphone audial decoding mechanism to log in your users, then no, Cypress won't work with that.  But seriously, Cypress is a **development** tool, which makes it easy to test your web applications. If your application is doing 100x things to make it extremely difficult to access, Cypress won't magically make it any easier.

Because Cypress is a development tool, you can always make your application more accessible while in your development environment. If you want, simply disable crazy steps in your authentication systems while you're in your testing environment. After all, that's why we have different environments! Normally you already have a development environment, a testing environment, a staging environment, and a production environment.  So simply expose the parts of your system you want accessible in each appropriate environment.

In doing so, Cypress may not be able to give you 100% coverage without you changing anything, but that's okay. Just use different tools to test the crazier, less accessible parts of your application, and let Cypress test the other 99%.

Just remember, Cypress won't make a non-testable application suddenly testable. It's on your shoulders to architect your code in an accessible manner.

# I have an insanely complex JavaScript application with dragging and dropping, complex virtual DOM interactions, async loading templates, two-way-data-binding, pushState routing, all on the latest and greatest JS framework which I wrote and released today... will Cypress work?
Yes, definitely yes.

# Can I use Cypress to script user-actions on an external site like `gmail.com`?
No. There are already lots of tools to do that. Using Cypress to test against a 3rd party application is not supported. It **may** work but will defeat the purpose of why it was created. You use Cypress *while* you develop **your** application, it helps you write your tests.