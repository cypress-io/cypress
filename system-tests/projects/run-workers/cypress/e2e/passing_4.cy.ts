import { webglRenderer } from '../webgl-renderer'

it('passes 4', () => {
  cy.task('recordSpec', Cypress.spec.relative)
  cy.task('recordRenderer', webglRenderer())
  cy.wait(4000)
})
