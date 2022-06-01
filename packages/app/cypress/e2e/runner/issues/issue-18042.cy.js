import { loadSpec } from '../support/spec-loader'

// https://github.com/cypress-io/cypress/issues/18042
describe('issue 18042', () => {
  it('Call count is shown even if cy.stub().log(false)', function () {
    loadSpec({
      filePath: 'issues/issue-18042.cy.js',
      passCount: 1,
    })

    cy.contains('Spies / Stubs (1)').click()
    cy.get('.call-count').eq(1).should('have.text', '1')
  })
})
