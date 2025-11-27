import React from 'react'
import Home from './page'

describe('<Home />', () => {
  it('renders', () => {
    cy.mount(<Home />)
    cy.contains('h1', 'Welcome to Next.js!')
  })
})
