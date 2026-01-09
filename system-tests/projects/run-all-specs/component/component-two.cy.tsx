import React from 'react'
import ComponentTwo from './component-two'

describe('<ComponentTwo />', () => {
  it('renders', () => {
    cy.mount(<ComponentTwo />)
    cy.get('h1').should('have.text', 'I am Component Two')
  })
})
