import React from 'react'
import ComponentOne from './component-one'

describe('<ComponentOne />', () => {
  it('renders', () => {
    cy.mount(<ComponentOne />)
    cy.get('h1').should('have.text', 'I am Component One')
  })
})
