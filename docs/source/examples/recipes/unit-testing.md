---
title: Unit Testing
comments: false
---

# FizzBuzz

[ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_application_code_spec.js)

- Unit test your own application code libraries
- Import modules using ES2015
- Test simple math functions
- Test the canonical *fizzbuzz* test

# React w/Enzyme

[ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_react_enzyme_spec.js)

- Unit test a React JSX Component using [Enzyme](http://airbnb.io/enzyme/)
- Import `enzyme` from `node_modules`
- Extend chai assertions with [`chai-enzyme`](https://github.com/producthunt/chai-enzyme)

# Stubbing Dependencies

[ Code](https://github.com/cypress-io/cypress-example-recipes/blob/master/cypress/integration/unit_test_stubbing_dependencies_spec.js)

- Use {% url `cy.stub()` stub %} to stub dependencies in a unit test
- Handle promises returned by stubbed functions
- Handle callbacks in stubbed functions
