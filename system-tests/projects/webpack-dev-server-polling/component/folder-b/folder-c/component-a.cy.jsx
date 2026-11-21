import React from 'react'
import ComponentA from './component-a'

describe('<ComponentA />', () => {
  it('renders', () => {
    cy.mount(<ComponentA />)
    cy.get('h1').should('have.text', 'I am Component A')
  })
})
