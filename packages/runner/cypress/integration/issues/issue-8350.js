const { createCypress } = require('../../support/helpers')
const { verify } = createCypress()

// https://github.com/cypress-io/cypress/issues/8214
// https://github.com/cypress-io/cypress/issues/8288
// https://github.com/cypress-io/cypress/issues/8350
describe('issue-8350', { viewportHeight: 900 }, () => {
  const file = 'nested_hooks_spec.js'

  verify.it('errors when nested hook', {
    file,
    // firefox points to col 18, chrome 7
    column: '(7|18)',
    codeFrameText: 'beforeEach(()=>',
    message: `Cypress detected you registered a(n) beforeEach hook while a test was running`,
  })

  afterEach(() => {
    cy.percySnapshot()
  })
})
