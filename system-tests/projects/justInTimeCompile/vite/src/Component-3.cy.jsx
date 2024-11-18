import React from 'react'
import Component3 from './Component-3.jsx'

describe('<Component3 />', () => {
  it('renders', () => {
    cy.mount(<Component3 />)
    cy.get('h1').should('have.text', 'I am Component Three compiled by vite!')
  })
})
