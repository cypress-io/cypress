import React from 'react'
import HelloEarth from './HelloEarth.jsx'

describe('<HelloEarth />', () => {
  it('test 1', () => {
    cy.mount(<HelloEarth />)
    cy.get('#earth-text').type('Hello Earth')
    cy.get('#earth-text').should('have.value', 'Hello Earth')
  })

  it('test 2', () => {
    cy.mount(<HelloEarth />)
    cy.get('#earth-text').type('Where\'s Mars?')
    cy.get('#earth-text').should('have.value', 'Where\'s Mars?')
  })
})
