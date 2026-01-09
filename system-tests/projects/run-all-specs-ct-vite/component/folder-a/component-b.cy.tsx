import React from 'react'
import ComponentB from './component-b'

describe('<ComponentB />', () => {
  it('renders', () => {
    cy.mount(<ComponentB />)
    cy.get('h1').should('have.text', 'I am Component B')
  })
})
