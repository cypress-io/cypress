const { createCypress } = require('../../support/helpers')
const { runIsolatedCypress } = createCypress()

// https://github.com/cypress-io/cypress/issues/8350
describe('issue-8350', { viewportHeight: 900 }, () => {
  it('does not hang on nested hook', () => {
    runIsolatedCypress('cypress/fixtures/hooks/nested_hooks_spec.js')
    cy.contains('Cypress detected you registered a beforeEach')
    // TODO: add assertion for codeFrame
    cy.percySnapshot()
  })
})
