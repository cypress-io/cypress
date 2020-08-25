const { createCypress } = require('../../support/helpers')
const { verify } = createCypress()

// https://github.com/cypress-io/cypress/issues/8350
describe('issue-8350', { viewportHeight: 900 }, () => {
  const file = 'nested_hooks_spec.js'

  // createVerifyTest(file)
  // cy.contains('Cypress detected you registered a beforeEach')
  // TODO: add assertion for codeFrame

  verify.it('test', {
    file,
    // firefox points to col 18, chrome 7
    column: '(7|18)',
    codeFrameText: 'beforeEach(()=>',
    message: `Cypress detected you registered a beforeEach hook while a test was running`,
  })

  afterEach(() => {
    cy.percySnapshot()
  })
})
