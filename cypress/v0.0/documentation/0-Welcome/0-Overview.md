excerpt: What is Cypress
slug: overview

Testing is the essential bedrock of software, and I think we can all agree it's a must-have.  So why isn't every web application fully covered with tests? There are many testing tools for the front end, but most (if not all) suffer from these crippling problems:

* Testing environments take too long to initially setup.
* Tests are often extremely brittle, and randomly fail.
* Running an entire test suite takes minutes, if not hours to complete.
* Debugging across browsers and browser versions is incredibly time consuming.
* Error messages are obtuse, indirect, and increase the time it takes to debug.
* Integration / functional tests are coupled directly to the server.
* Handling mock data, or fixtures, is difficult.
* Testing often occurs *after* features are built because there isn't an easy test-driven development (TDD) process available.
* Even though unit testing JavaScript is reasonably simple, unit testing alone does not verify your application is fully functioning for users.
* Integration testing tools have trouble handling complicated asynchronous logic that is found on most modern single-page JavaScript applications.
* Testing through a console is obscure and fails to give full visibility on the problems your users will face using your web application.
* Selenium drivers differ in implementation details which means code breaks across different browsers and browser versions.

These are just a few reasons why it's often difficult or impossible to test modern web applications. Often it takes longer to write a passing test for a feature, than to actually build the feature.

There is a lot of mental friction when writing tests. Testing just becomes another layer to cut through. Because testing is often brittle, we lose confidence that our tests are delivering any additional value.

Because of this complexity, most organizations have an entire Quality Assurance (QA) department dedicated to these tasks.

Cypress aims to solve the biggest difficulties when it comes to testing web applications. It aims to reduce the mental effort required to write tests. Cypress works in your typical development workflow (in the browser) and allows you to see your application while it's being tested. This enables you to practice TDD since there is no context shift between testing and development.