import React from 'react'
import { mount } from '@cypress/react'
import MyComponent from './my-component.jsx'

it('is a test', () => {
  mount(<MyComponent name="some text" />)
  cy.contains('Hello').should('be.visible')
})
