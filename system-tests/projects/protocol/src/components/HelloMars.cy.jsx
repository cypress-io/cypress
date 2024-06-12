import React from 'react'
import HelloMars from './HelloMars.jsx'

describe('<HelloMars />', () => {
  it('test 1', () => {
    cy.mount(<HelloMars />)
    cy.get('#mars-text')
    .type('Hello Mars')
    .should('have.value', 'Hello Mars')
  })

  it('test 2', () => {
    cy.mount(<HelloMars />)
    cy.get('#mars-text')
    .type('Where\'s Earth?')
    .should('have.value', 'Where\'s Earth?')
  })
})
