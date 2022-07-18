import React from 'react'
import { mount } from 'cypress/react17'

describe('NewComponent', () => {
  it('renders the new component', () => {
    mount(<div>Component New</div>)

    cy.contains('Component New').should('be.visible')
  })
})
