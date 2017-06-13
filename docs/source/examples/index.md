---
title: Examples
comments: false
---

# Applications

## jQuery

**{% fa fa-angle-right %} Kitchen Sink** | [Code](https://github.com/cypress-io/cypress-example-kitchensink)

This is an example app is used to showcase every command available in Cypress.


- Query and traverse DOM elements using `cy.get()`, `cy.find()` and other commands.
- Type into forms, click elements, select dropdowns, and other actions.
- Change the size of the viewport using `cy.viewport()`
- Navigation to other pages
- Do network requests, and wait on responses, and stub response data using `cy.fixture()`.
- Inspect and manipulate cookies and localStorage.

![kitchensink](https://cloud.githubusercontent.com/assets/1268976/14084252/e309e370-f4e7-11e5-9562-24f516563ac9.gif)

Stack | -
 -- | --
Frontend | [jQuery](https://jquery.com/)
Backend | [Node](https://nodejs.org/)
CI | [TravisCI](https://travis-ci.org/), [CircleCI](https://circleci.com), [Codeship](https://codeship.com/)

## React

**{% fa fa-angle-right %} TodoMVC** | [Code](https://github.com/cypress-io/cypress-example-todomvc)

This repo compares [Cypress Tests](https://github.com/cypress-io/cypress-example-todomvc/blob/master/cypress/integration/app_spec.js) to [official TodoMVC Tests](https://github.com/tastejs/todomvc/blob/master/tests/test.js). This gives you a good comparison of writing and running tests in Cypress versus vanilla Selenium.

- Query and make assertions about DOM elements state.
- Type into an input using `cy.type()`
- Create a custom `cy.createTodo()` command to run multiple cy commands.
- Click and double click elements using `cy.click()` and `cy.dblclick()`

![todomvc-gif](https://cloud.githubusercontent.com/assets/1268976/12985445/ad168098-d0c0-11e5-94e7-2f2e619bae93.gif)

Stack | -
 -- | --
Frontend | [React](https://facebook.github.io/react/)
Backend | [Node](https://nodejs.org/)
CI | [TravisCI](https://travis-ci.org/), [CircleCI](https://circleci.com)

## Angular

**{% fa fa-angle-right %} PieChopper** | [Code](https://github.com/cypress-io/cypress-example-piechopper)

This is a single page application with a decent amount of features. The [tests](https://github.com/cypress-io/cypress-example-piechopper/blob/master/cypress/integration/app_spec.js) involve a lot of form submissions.

- Test mobile responsive views using `cy.viewport()`
- Test that the app scrolls correctly
- Check checkboxes using `cy.check()`
- Stub responses from our backend using `cy.route()`

![piechopper-gif](https://cloud.githubusercontent.com/assets/1268976/12985444/ad14159c-d0c0-11e5-8e50-2b64a1d389ac.gif)

Stack | -
 -- | --
Frontend | [Angular](https://angularjs.org/)
Backend | [Node](https://nodejs.org/)
CI | [TravisCI](https://travis-ci.org/), [CircleCI](https://circleci.com)

**{% fa fa-angle-right %} Phonecat** | [Code](https://github.com/cypress-io/cypress-example-phonecat)

This tests the [original Angular Phonecat example app](https://github.com/angular/angular-phonecat) using Cypress.

- Test redirect behavior of application using `.hash()`
- Test loading behavior of app

![phonecat-angular-tutorial-app-tested-in-cypress 2d78065e](https://user-images.githubusercontent.com/1271364/26952946-ac944a10-4c75-11e7-8e21-e0290537b153.jpg)

Stack | -
 -- | --
Frontend | [Angular](https://angularjs.org/)
Backend | [Node](https://nodejs.org/)
CI | [TravisCI](https://travis-ci.org/)

# [Recipes](https://github.com/cypress-io/cypress-example-recipes)

## Unit Testing

**{% fa fa-angle-right %} FizzBuzz** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_application_code_spec.js)

- Unit test your own application code libraries
- Import modules using ES2015
- Test simple math functions
- Test the canonical *fizzbuzz* test

**{% fa fa-angle-right %} React w/Enzyme** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_react_enzyme_spec.js)

- Unit test a React JSX Component using [Enzyme](http://airbnb.io/enzyme/)
- Import `enzyme` from `node_modules`
- Extend chai assertions with [`chai-enzyme`](https://github.com/producthunt/chai-enzyme)

**{% fa fa-angle-right %} Stubbing Dependencies** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_stubbing_dependencies_spec.js)

- Use {% url `cy.stub()` stub %} to stub dependencies in a unit test
- Handle promises returned by stubbed functions
- Handle callbacks in stubbed functions

## Logging In

**{% fa fa-angle-right %} HTML Web Form** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_html_web_form_spec.js)

- Test a standard `username/password` HTML form
- Test errors submitting invalid data
- Test unauthenticated redirects
- Authenticate users with cookies
- Create a custom `login` test command
- Bypass needing to use your actual UI
- Increase speed of testing with {% url `cy.request()` request %}

**{% fa fa-angle-right %} XHR Web Form** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_xhr_web_form_spec.js)

- Test an AJAX backed `username/password` form
- Test errors submitting invalid data
- Stub JSON based XHR requests
- Stub application functions
- Create a custom `login` test command
- Bypass needing to use your actual UI
- Increase speed of testing with {% url `cy.request()` request %}

**{% fa fa-angle-right %} CSRF Tokens** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_csrf_tokens_spec.js)

- Use {% url `cy.request()` request %} to get around CSRF protections
- Parse CSRF tokens out of HTML
- Parse CSRF tokens out of response headers
- Expose CSRF via a route
- Disable CSRF when not in production

**{% fa fa-angle-right %} Single Sign On** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/logging_in_single_sign_on_spec.js)

- Login when authentication is done on a 3rd party server
- Parse tokens using {% url `cy.request()` request %}
- Manually set tokens on local storage
- Map external hosts and point to local servers

## Testing the DOM

**{% fa fa-angle-right %} Tab Handling and Anchor Links** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/tab_handling_anchor_links_spec.js)

- Test anchor links opening in new tabs: `<a target="_blank">`
- Test anchor links that link to external domains: `<a href="...">`
- Prevent content from opening in a new tab
- Request external content that would open in a new tab
- Speed up tests by reducing loading times

**{% fa fa-angle-right %} Dealing with Hover and Hidden Elements** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/hover_hidden_elements_spec.js)

- Interact with elements which are hidden by CSS
- Trigger `mouseover`, `mouseout`, `mouseenter`, `mouseleave` events

## Working with Backend

**{% fa fa-angle-right %} Bootstrapping your App with Test Data** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/bootstrapping_app_test_data_spec.js)

- Use {% url `cy.visit()` visit %} `onBeforeLoad` callback
- Start your application with test data
- Stub an XHR to seed with test data
- Wait on an XHR to finish

## Spies, Stubs, and Clocks

**{% fa fa-angle-right %} Controlling Behavior with Spies, Stubs and Clocks** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/spy_stub_clock_spec.js)

- Use {% url `cy.spy()` spy %} to verify the behavior of a function
- Use {% url `cy.stub()` stub %} to verify and control the behavior of a function
- Use {% url `cy.clock()` clock %} and {% url `cy.tick()` tick %} to control time
- Stub `window.fetch` to control server responses

## Extending Cypress

**{% fa fa-angle-right %} Extending Chai with Assertion Plugins** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/extending_chai_assertion_plugins_spec.js)

- Extend [`chai`](http://chaijs.com/) with the [`chai-date-string`](http://chaijs.com/plugins/chai-date-string/) assertion plugin
- Extend [`chai`](http://chaijs.com/) with the [`chai-colors`](http://chaijs.com/plugins/chai-colors/) assertion plugin
- Globally extend [`chai`](http://chaijs.com/) for all specs

**{% fa fa-angle-right %} ES2015 / CommonJS Modules** | [ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/es2015_commonjs_modules_spec.js)

- Import ES2015 modules
- Require CommonJS modules
- Organize reusable utility functions
- Import 3rd party `node_modules`
