import AlertMessage from './AlertMessage.vue'
import { mount } from '@cypress/vue'

describe('AlertMessage', () => {
  beforeEach(() => {
    mount(AlertMessage)
  })

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
