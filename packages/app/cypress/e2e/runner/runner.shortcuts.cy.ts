import { loadSpec } from './support/spec-loader'

describe('runner shortcuts', () => {
  it('should run a spec', () => {
    loadSpec({
      filePath: 'runner/simple-single-test.runner.cy.js',
      passCount: 1,
      failCount: 0,
    })

    cy.findByRole('button', { name: 'Specs' }).should('have.attr', 'aria-expanded', 'false')
    cy.get('body').type('{ctrl+k}')
    cy.findByRole('button', { name: 'Specs' }).should('have.attr', 'aria-expanded', 'true')
    cy.findByLabelText('Search Specs').should('be.focused')
  })
})
