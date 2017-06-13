---
title: TodoMVC
comments: false
---

[Code](https://github.com/cypress-io/cypress-example-todomvc)

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
