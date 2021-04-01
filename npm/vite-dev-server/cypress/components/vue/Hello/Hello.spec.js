/// <reference types="cypress" />
import { mount } from '@cypress/vue'
import Hello from './Hello.vue'

describe('Hello', () => {
  it('shows error for short text', () => {
    cy.viewport(300, 200)
    mount(Hello)
    // use the component like a real user
    cy.findByRole('textbox').type('abc')
    cy.contains('.error', 'enter a longer username')
    // now enter a longer string
    cy.findByRole('textbox').type('12345')
    cy.get('.error').should('not.exist')
  })
})
