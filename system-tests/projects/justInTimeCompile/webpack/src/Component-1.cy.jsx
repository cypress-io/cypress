import React from 'react'
import Component1 from './Component-1.jsx'

describe('<Component1 />', () => {
  it('renders', () => {
    cy.mount(<Component1 />)
    cy.get('h1').should('have.text', 'I am Component One compiled by webpack!')
  })
})
