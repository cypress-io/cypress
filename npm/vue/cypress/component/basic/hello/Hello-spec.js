/// <reference types="cypress" />
import Hello from './Hello.vue'
import { mount } from '@cypress/vue'

describe('Hello', () => {
  it('shows error for short text', () => {
    cy.viewport(300, 200)
    mount(Hello)
    // use the component like a real user
    cy.get('[data-cy=username]').type('abc')
    cy.contains('.error', 'enter a longer username')
    // now enter a longer string
    cy.get('[data-cy=username]').type('12345')
    cy.get('.error').should('not.exist')
  })
})
