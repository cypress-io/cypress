import React from 'react'
import { mount } from '@cypress/react'
import App from './App'

describe('Context example', () => {
  it('renders', () => {
    mount(<App />)
    // the label "dark" was passed through React context
    cy.contains('button', 'dark').should('be.visible')
  })
})
