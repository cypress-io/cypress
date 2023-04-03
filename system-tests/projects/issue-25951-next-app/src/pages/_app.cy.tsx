import React from 'react'
import App from './_app'

describe('<App />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<App />)
    cy.contains('Hello world')
  })
})
