---
title: Kitchen Sink
comments: false
containerClass: examples
---

{% fa fa-github %} {% url  https://github.com/cypress-io/cypress-example-kitchensink %}

## Overview

This is an example app is used to showcase every command available in Cypress.

- Query and traverse DOM elements using {% url "`cy.get()`" get %}, {% url "`cy.find()`" find %} and other commands.
- {% url "`.type()`" type %} into forms, {% url "`.click()`" click %} elements, {% url "`.select()`" select %} dropdowns, and other actions.
- Change the size of the viewport using {% url "`cy.viewport()`" viewport %}.
- Navigate to other pages.
- {% url "`cy.route()`" route %} network requests, {% url "`cy.wait()`" wait %} on responses, and stub response data using {% url "`cy.fixture()`" fixture %}.
- Inspect and manipulate cookies and localStorage.

![kitchensink running](/img/examples/kitchen-sink-tests-running.gif)

## Stack

Stack | -
 -- | --
Frontend | {% url "jQuery" https://jquery.com/ %}
Backend | {% url "Node" https://nodejs.org/ %}
CI | {% url "TravisCI" https://travis-ci.org/ %}, {% url "CircleCI" https://circleci.com %}, {% url "Codeship" https://codeship.com/ %}
