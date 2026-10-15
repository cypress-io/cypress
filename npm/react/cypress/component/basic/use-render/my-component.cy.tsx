import React from 'react'
import { mount } from '@cypress/react'
import MyComponent from './my-component'

it('is a test', () => {
  mount(<MyComponent />)
  cy.contains('Hello').should('be.visible')
})
