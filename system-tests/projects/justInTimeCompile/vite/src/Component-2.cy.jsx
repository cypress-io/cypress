import React from 'react'
import Component2 from './Component-2.jsx'

describe('<Component2 />', () => {
  it('renders', () => {
    cy.mount(<Component2 />)
    cy.get('h1').should('have.text', 'I am Component Two compiled by vite!')
  })
})
