/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import App from './App'

describe('Tailwind App', () => {
  it('is stylish', () => {
    mount(<App />)
    // it has expected colors and styles
    cy.get('h1.font-bold').should('have.css', 'font-weight', '700')
    cy.get('button.text-white')
      .should('have.css', 'color', 'rgb(255, 255, 255)')
      .and('have.class', 'rounded')

    cy.log('confirm rounded corners')
    cy.get('button.rounded').should($el => {
      expect($el.css('border-radius')).to.match(/^\d+px$/)
    })

    cy.screenshot()
  })
})
