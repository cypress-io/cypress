import React from 'react'
import HelloEarth from './HelloEarth.jsx'

describe('<HelloEarth />', () => {
  it('test 1', () => {
    cy.mount(<HelloEarth />)
    cy.get('#earth-text')
    .type('Hello Earth')
    .should('have.value', 'Hello Earth')
  })

  it('test 2', () => {
    cy.mount(<HelloEarth />)
    cy.get('#earth-text')
    .type('Where\'s Mars?')
    .should('have.value', 'Where\'s Mars?')
  })
})
