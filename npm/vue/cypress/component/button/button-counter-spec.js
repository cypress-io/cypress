import ButtonCounter from './ButtonCounter.vue'
import { mountCallback } from '@cypress/vue'

/* eslint-env mocha */
describe('ButtonCounter', () => {
  beforeEach(mountCallback(ButtonCounter))

  it('starts with zero', () => {
    cy.contains('button', '0')
  })

  it('increments the counter on click', () => {
    cy.get('button').click().click().click().contains('3')
  })

  it('emits "increment" event on click', () => {
    const spy = cy.spy()

    Cypress.vue.$on('increment', spy)
    cy.get('button')
    .click()
    .click()
    .then(() => {
      expect(spy).to.be.calledTwice
    })
  })
})
