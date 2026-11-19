# Code coverage example

The plugin "@cypress/vue" can automatically instrument JavaScript and Vue files and generate code coverage report by using [cypress-io/code-coverage](https://github.com/cypress-io/code-coverage) plugin (included). These tests in [unit.cy.ts](unit.cy.ts) and [Calculator.cy.ts](Calculator.cy.ts) check if the files were instrumented by checking `window.__coverage__` object.
