import React from 'react'
import { mount } from 'cypress-react-unit-test'
import App from './App.jsx'

describe('Context example', () => {
  it('renders', () => {
    mount(<App />)
    // the label "dark" was passed through React context
    cy.contains('button', 'dark').should('be.visible')
  })
})
