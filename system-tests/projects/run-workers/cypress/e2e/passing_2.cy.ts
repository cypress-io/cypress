import { webglRenderer } from '../webgl-renderer'

it('passes 2', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.task('recordRenderer', webglRenderer())
  cy.wait(4000)
})
