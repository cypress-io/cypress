/// <reference types="cypress" />
import Calculator from './Calculator.vue'
import { mount } from '@cypress/vue'

// TODO: fix with https://github.com/cypress-io/cypress/issues/30706
describe.skip('Calculator', () => {
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

  it('adds two decimal numbers', () => {
    cy.viewport(400, 50)
    mount(Calculator)
    cy.get('[data-cy=a]').clear().type('22.6')
    cy.get('[data-cy=b]').clear().type('19.4')
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
