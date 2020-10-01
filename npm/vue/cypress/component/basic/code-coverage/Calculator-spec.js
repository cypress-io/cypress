/// <reference types="cypress" />
import Calculator from './Calculator.vue'
import { mount } from '@cypress/vue'

describe('Calculator', () => {
  it('adds two numbers', () => {
    cy.viewport(400, 200)
    mount(Calculator)
    cy.get('[data-cy=a]').clear().type(23)
    cy.get('[data-cy=b]').clear().type(19)
    cy.contains('= 42')

    cy.log('**check coverage**')
    cy.wrap(window)
    .its('__coverage__')
    // and it includes information even for this file
    .then(Object.keys)
    .should('include', Cypress.spec.absolute)
    .and((filenames) => {
      // coverage should include Calculator.vue file
      const includesVue = filenames.some((filename) => {
        return filename.endsWith('Calculator.vue')
      })

      expect(includesVue, 'Calculator.vue is instrumented').to.be.true
    })
  })
})
