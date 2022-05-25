import AlertMessage from './AlertMessage.vue'
import { mountCallback } from '@cypress/vue'

/* eslint-env mocha */
describe('AlertMessage', () => {
  beforeEach(mountCallback(AlertMessage))
  it('loads', () => {
    cy.get('button').should('be.visible')
  })

  it('calls window.alert', () => {
    const spy = cy.spy().as('alert')

    cy.on('window:alert', spy)
    cy.get('button').click()
    cy.get('@alert').should('have.been.calledOnce')
    cy.get('@alert').should('have.been.calledWith', 'Hello Vue')
  })
})
