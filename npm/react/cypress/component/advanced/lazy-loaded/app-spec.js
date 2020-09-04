import React from 'react'
import { mount } from 'cypress-react-unit-test'
// import App from './App'

// NOTE: lazy loading does not work in this repo
// https://github.com/bahmutov/cypress-react-unit-test/issues/136
describe.skip('App loads', () => {
  it('renders lazy component', () => {
    // eslint-disable-next-line
    mount(<App />)
    cy.contains('The Other')
  })
})
