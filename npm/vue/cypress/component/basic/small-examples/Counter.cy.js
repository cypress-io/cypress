/// <reference types="cypress" />

import Counter from './Counter.vue'
import { mount } from '@cypress/vue'

describe('Counter', () => {
  it('renders correctly', () => {
    mount(Counter)
    cy.contains('Count: 0')
  })

  it('correctly responds to button clicks', () => {
    mount(Counter)
    cy.contains('Count: 0')

    // save button aliases
    cy.contains('button', 'Add').as('add')
    cy.contains('button', 'Subtract').as('subtract')

    cy.get('@add').click()
    cy.contains('Count: 1')

    cy.get('@subtract').click()
    cy.contains('Count: 0')

    cy.get('@add').click().click().click().click()
    cy.contains('Count: 4')

    cy.get('@subtract').click().click()
    cy.contains('Count: 2')
  })
})
