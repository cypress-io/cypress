import { mount } from '@cypress/vue'
import 'windi.css'

import App from '../../src/App.vue'
import { createStore } from '../../src/store'

describe('App', () => {
  it('does not render previous button on first step', () => {
    const store = createStore()

    mount(App, {
      global: {
        plugins: [store],
      },
    })

    cy.get('button[cy-data="previous"]').should('not.exist')
    cy.get('button').contains('Next Step').should('exist').should('be.disabled')
  })

  it('completes workflow for component testing', () => {
    const store = createStore()

    mount(App, {
      global: {
        plugins: [store],
      },
    })

    cy.get('div').contains('Cypress Dashboard')
    cy.get('div').contains('Welcome! What kind of tests would you like to run?')

    // select e2e
    cy.get('label[for="e2e"]').click()

    // go to next step
    cy.get('button').contains('Next Step').click()

    // actually, we want CT! go back!
    cy.get('button').contains('Previous Step').click()

    cy.get('label[for="component"]').click()
    // select e2e

    // go to next step
    cy.get('button').contains('Next Step').click()

    cy.get('[data-cy="select-framework"]').select('React 16 x Webpack 4')
    cy.get('button').contains('Next Step').click()

    // last step
    cy.get('div').contains('Time to install dependencies')

    // "Next Step" is now "Launch" - there is no next step.
    cy.get('button').contains('Launch')
  })
})
