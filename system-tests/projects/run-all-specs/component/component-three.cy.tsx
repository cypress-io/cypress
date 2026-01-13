import React from 'react'
import ComponentThree from './component-three'

describe('<ComponentThree />', () => {
  it('renders', () => {
    cy.mount(<ComponentThree />)
    cy.get('h1').should('have.text', 'I am Component Three')
  })
})
