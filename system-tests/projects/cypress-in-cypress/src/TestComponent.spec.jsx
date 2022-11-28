import React from 'react'
import { mount } from 'cypress/react17'

describe('TestComponent', () => {
  it('renders the test component', () => {
    mount(<div>Component Test</div>)

    cy.contains('Component Test').should('be.visible')
  })
})
