import ButtonCounter from './ButtonCounter.vue'
import { mount } from '@cypress/vue'

/* eslint-env mocha */
describe('ButtonCounter', () => {
  beforeEach(() => {
    mount(ButtonCounter)
  })

  it('starts with zero', () => {
    cy.contains('button', '0')
  })

  it('increments the counter on click', () => {
    cy.get('button').click().click().click().contains('3')
  })

  it('emits "increment" event on click', () => {
    cy.get('button')
    .click()
    .click()
    .then(() => {
      cy.wrap(Cypress.vueWrapper.emitted()).should('have.property', 'increment')
    })
  })
})
