import { loadSpec } from './support/spec-loader'

describe('Aliases', () => {
  it('validates that dynamic aliases display correctly in the runner', () => {
    loadSpec({
      filePath: 'runner/dynamic-route-aliases.runner.cy.js',
      passCount: 1,
      failCount: 0,
    })

    cy.get('.alias-container').last().within(() => {
      cy.contains('fooAlias')
    })
  })
})
