---
title: TodoMVC
comments: false
---

# Overview

{% url "Code" https://github.com/cypress-io/cypress-example-todomvc %}

This repo compares {% url "Cypress Tests" https://github.com/cypress-io/cypress-example-todomvc/blob/master/cypress/integration/app_spec.js %} to {% url "official TodoMVC Tests" https://github.com/tastejs/todomvc/blob/master/tests/test.js %}. This gives you a good comparison of writing and running tests in Cypress versus vanilla Selenium.

- Query and make assertions about DOM elements state.
- Type into an input using {% url "`cy.type()`" type %}.
- Create a custom `cy.createTodo()` command to run multiple cy commands.
- Click and double click elements using {% url "`cy.click()`" click %} and {% url "`cy.dblclick()`" dblclick %}.

![todomvc-gif](https://cloud.githubusercontent.com/assets/1268976/12985445/ad168098-d0c0-11e5-94e7-2f2e619bae93.gif)

# Stack

Stack | -
 -- | --
Frontend | {% url "React" https://facebook.github.io/react/ %}
Backend | {% url "Node" https://nodejs.org/ %}
CI | {% url "TravisCI" https://travis-ci.org/ %}, {% url "CircleCI" https://circleci.com %}
