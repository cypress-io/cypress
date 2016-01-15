slug: philosophy
excerpt: What we believe and why

## Why Test?

Since you've landed here, hopefully you’re open to the idea that testing code has some benefits. But, maybe you're still weighing the benefits or maybe you just need some fuel to convince management or your team that testing is worth investing into. Let's go over some of the reasons why we bother testing our code.

Invest in testing to:

* **Increase code quality:** Writing tests challenges you think more clearly about edge cases and code for them.
* **Save time:** Less time is spent finding and tracking down bugs when there are tests that fail automatically when bugs are introduced.
* **Decrease code complexity:** Complex code requires being broken into smaller pieces when testing. It also helps you think through how dependencies and input/output is handled.
* **Encourage refactoring:** Knowing there are tests surrounding the functionality of your code means you can feel more comfortable playing around and refactoring that code.
* **Develop faster:** There is time up front that goes into planning a test strategy, but over time, velocity will increase.
* **Reduce regression:** Having tests cover your code means that when you add new features, you can see if any existing features behavior changed.
* **Increase confidence:** The risk of breaking code increases as your applications complexity grows. Being able to catch regressions makes it more likely that your changes will not inadvertently break things that used to work.
* **Self-document:** Test suites cover the expected behavior of your code and are a great documentation reference.


## Why not test?

As evidenced above, there are clear benefits to testing your code. But many *web applications* are not fully covered in tests. Why? There are many testing tools for the front end, but most (if not all) suffer from some crippling problems:

* Testing environments take too long to setup.
* Tests are often brittle, and randomly fail.
* Running an entire test suite takes too long (sometimes hours).
* Debugging across browsers and browser versions is very time consuming.
* Error messages are obtuse, indirect, and increase the time it takes to debug.
* Integration tests are often coupled directly to the server.
* Handling mock data, or fixtures, is difficult.
* Testing often occurs *after* features are built because there isn't an apparent test-driven development (TDD) flow.
* Even if unit testing JavaScript is reasonably simple, unit testing alone does not verify your application is fully functioning.
* Handling complicated asynchronous logic that is found on most modern single-page JavaScript applications is impossible.
* Testing through a console is obscure and doesn't give full visibility on the problems your users will face using your web application.
* Selenium drivers differ in implementation details which means code breaks across different browsers and browser versions.

These are just a few reasons why it's often difficult to test modern web applications. Often it takes longer to write a passing test for a feature, than to actually build the feature.

There is a lot of mental friction when writing tests. Testing just becomes another layer to cut through. Because testing is often brittle, we lose confidence that our tests are delivering any additional value.

Because of this complexity, most organizations have an entire Quality Assurance (QA) department dedicated to these tasks.

Cypress aims to solve the biggest difficulties when it comes to testing web applications. It aims to reduce the mental effort required to write tests. Cypress works in your typical development workflow (in the browser) and allows you to see your application while it's being tested. This enables you to practice TDD since there is no context shift between testing and development.

## Goals of Cypress

* Allow you to write your first test in less than 5 minutes.
* Integrate testing within your normal development process.
* Allow you to drive your application with tests instead of manual interactions.
* Provide **clear**, debuggable error messages.
* Make dealing with `AJAX/XHR` ridiculously simple.
* Provide cross-browser testing and debugging **without** leaving Google Chrome.
* Instantly integrate any Continuous Integration (CI) provider.
* Work with any JavaScript framework (current and future).
* Work in all modern browsers (`IE11+`).
* Replace server side testing tools like `Capybara`.
* Allow you to communicate directly to a backend server for seeding / querying.
* Require zero code changes to your existing application.
* Eliminate the need to code or deal with `Selenium`.
* Make writing tests an enjoyable, fun experience.
* Encourage writing good tests.
