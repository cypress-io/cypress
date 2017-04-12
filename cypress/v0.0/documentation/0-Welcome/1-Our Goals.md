slug: our-goals
excerpt: What we believe and why

# Contents

- :fa-angle-right: [Problems with current front-end testing tools](#problems-with-current-front-end-testing-tools)
- :fa-angle-right: [Goals of Cypress](#goals-of-cypress)

***

# Problems with current front-end testing tools

There are clear benefits to testing code. But many *web applications* are not fully covered in tests. Why? There are many testing tools for the front end, but most (if not all) suffer from some problems.

* **Poor Setup:** Testing environments take too long to setup.
* **Unreliable:** Tests are often brittle, and randomly fail.
* **Time consuming:** Running an entire test suite takes too long (sometimes hours).
* **No Cross Browser Support:** Debugging across browsers and browser versions is very time consuming.
* **Obscure Error Messages:** Error messages are obtuse, indirect, and increase the time it takes to debug.
* **Coupled dependencies:** Integration tests are often coupled directly to the server.
* **Lacking fixture support:** Handling mock data, or fixtures, is difficult.
* **Don't encourage TDD:** Testing often occurs *after* features are built because there isn't an apparent test-driven development (TDD) flow.
* **Lack of integration testing:** Even if unit testing JavaScript is reasonably simple, unit testing alone does not verify your application is fully functioning.
* **Async hell:** Handling complicated asynchronous logic that is found on most modern single-page JavaScript applications is impossible.
* **No Visibility:** Testing through a console is obscure and doesn't give full visibility on the problems your users will face using your web application.
* **Buggy:** Selenium drivers differ in implementation details which means code breaks across different browsers and browser versions.

These are just a few reasons why it's often difficult to test modern web applications. Often it takes longer to write a passing test for a feature, than to actually build the feature.

There is a lot of mental friction when writing tests. Testing just becomes another layer to cut through. Because testing is often brittle, we lose confidence that our tests are delivering any additional value.

Because of this complexity, most organizations have an entire Quality Assurance (QA) department dedicated to these tasks.

> Cypress aims to solve the biggest difficulties when it comes to testing web applications. It aims to reduce the mental effort required to write tests. Cypress works in your typical development workflow (in the browser) and allows you to see your application while it's being tested. This enables you to practice TDD since there is no context shift between testing and development.

***

# Goals of Cypress

* **Easy Setup:** Allow you to write your first test in less than 5 minutes.
* **Automated:** Allow you to drive your application with tests instead of manual interactions.
* **Easy Integration:** Require zero code changes to your existing application.
* **In-Browser Testing:** Integrate testing within your normal development process.
* **JavaScript:** Allow you to write your test suite in JavaScript.
* **Enjoyable:** Make writing tests an enjoyable, fun experience.
* **Opinionated:** Encourage writing good tests.
* **Clear error messages:** Provide **clear**, debuggable error messages.
* **Intelligent Network Requests:** Make dealing with `AJAX/XHR` ridiculously simple.
* **Cross-browser support:** Provide cross-browser testing and debugging **without** leaving Google Chrome and work in all modern browsers (`IE11+`)
* **CI Integration:** Instantly integrate any Continuous Integration provider.
* **Accessible:** Work with any JavaScript framework (current and future).
* **Flexible:** Replace server side testing tools like `Capybara`.
* **Integrate with Server:** Allow you to communicate directly to a backend server for seeding / querying.
* **Elimate Selenium:** Eliminate the need to code or deal with `Selenium`.
