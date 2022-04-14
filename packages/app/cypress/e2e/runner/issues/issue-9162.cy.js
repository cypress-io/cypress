import { loadSpec } from '../support/spec-loader'

// https://github.com/cypress-io/cypress/issues/9162
describe('issue 9162', () => {
  it('tests does not hang even if there is a fail in before().', function () {
    loadSpec({
      filePath: 'issues/issue-9162.cy.js',
      passCount: 0,
      failCount: 1,
    })

    cy.contains('expected true to be false')
  })
})
