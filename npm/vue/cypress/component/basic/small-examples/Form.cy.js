/// <reference types="cypress" />

import Form from './Form.vue'
import { mount } from '@cypress/vue'

describe('Form', () => {
  const getByLabelText = (text) => {
    return cy
    .contains('label', text)
    .invoke('attr', 'for')
    .then((id) => {
      return cy.get(`input#${id}`)
    })
  }

  it('User can type and see output on the screen', () => {
    mount(Form)
    // save references to input fields
    getByLabelText('Name').as('name')
    getByLabelText('Email').as('email')
    cy.contains('Submit').as('submit')

    // initially the submit button is disabled
    cy.get('@submit').should('be.disabled')

    // Update the name field.
    cy.get('@name').type('James John')
    cy.get('@submit').should('be.disabled')

    // Add email.
    cy.get('@email').type('james@example.com')
    cy.get('@submit').should('not.be.disabled')
  })
})
