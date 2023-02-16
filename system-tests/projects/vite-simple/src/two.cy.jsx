import React from 'react'
import App from './App'

describe('<App />', () => {
  it('renders', () => {
    cy.mount(<App />)
    cy.contains('h1', 'Hello World')
  })
})
