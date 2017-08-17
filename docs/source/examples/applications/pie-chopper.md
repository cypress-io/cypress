---
title: PieChopper
comments: false
containerClass: examples
---

{% fa fa-github %} {% url  https://github.com/cypress-io/cypress-example-piechopper %}

## Overview

This is a single page application with a decent amount of features. The tests involve a lot of form submissions.

- Test mobile responsive views using {% url `cy.viewport()` viewport %}
- Test that the app scrolls correctly
- Check checkboxes using {% url `cy.check()` check %}
- Stub responses from our backend using {% url `cy.route()` route %}

![piechopper-gif](/img/examples/piechopper-tests-running.gif)

## Stack

Stack | -
 -- | --
Frontend | {% url "Angular" https://angularjs.org/ %}
Backend | {% url "Node" https://nodejs.org/ %}
CI | {% url "TravisCI" https://travis-ci.org/ %}, {% url "CircleCI" https://circleci.com %}
