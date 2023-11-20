import React from 'react'
import { mount } from 'cypress/react18'
import App from './_app'

describe('<App />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    mount(<App />)
    cy.contains('Hello world')
  })
})
