import React from 'react'
import App from './App'

describe('<App />', () => {
  it('renders', () => {
    // see: https://reactjs.org/docs/test-utils.html
    cy.mount(<App />)
  })
})
