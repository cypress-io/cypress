import React from 'react'
import { mount } from 'cypress-react-unit-test'
// import App from './App'

// https://github.com/bahmutov/cypress-react-unit-test/issues/136
describe.skip('App loads', () => {
  it('renders lazy component', () => {
    mount(<App />)
    cy.contains('The Other')
  })
})
