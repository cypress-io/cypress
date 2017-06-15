---
title: PieChopper
comments: false
---

[Code](https://github.com/cypress-io/cypress-example-piechopper)

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
