import { mount } from '@cypress/vue'
import 'windi.css'

import App from '../../src/App.vue'
import { createStore } from '../../src/store'

describe('App', () => {
  it('renders', () => {
    const store = createStore()

    mount(App, {
      global: {
        plugins: [store],
      },
    })

    cy.get('div').contains('Cypress Dashboard')
    cy.get('p').contains('Welcome! What kind of tests would you like to run?')

    // select e2e
    cy.get('button').contains('e2e').click()

    // go to next step
    cy.get('button').contains('Next Step').click()

    // actually, we want CT! go back!
    cy.get('button').contains('Previous Step').click()

    // select e2e
    cy.get('button').contains('component').click()

    // go to next step
    cy.get('button').contains('Next Step').click()

    cy.get('p').contains('You chose: component')

    // go to next step
    cy.get('button').contains('Next Step').click()

    // last step, time to install dependencies.
    cy.get('p').contains('Time to install dependencies.')
  })
})
