import React from 'react'
import ReactDom from 'react-dom/client'
import { mount } from '@cypress/react'
import Counter2WithHooks from './counter2-with-hooks'

describe('Counter2WithHooks', function () {
  it('changes document title', function () {
    mount(<Counter2WithHooks />, { ReactDom })
    cy.contains('0')
    cy.document().should('have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })
})
