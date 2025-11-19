import React from 'react'
import Home from './page'

describe('<Home />', () => {
  it('renders', () => {
    cy.mount(<Home />)
    cy.contains('h1', 'Welcome to Next.js!')

    // verify tailwind classes are applied correctly via import from support file.
    cy.get('main').should('have.css', 'background-color', 'oklch(0.769 0.188 70.08)')
  })
})
