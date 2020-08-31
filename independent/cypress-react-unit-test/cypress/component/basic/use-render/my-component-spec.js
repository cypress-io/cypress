import React from 'react'
import { mount } from 'cypress-react-unit-test'
import MyComponent from './my-component.jsx'

// example from https://github.com/bahmutov/cypress-react-unit-test/issues/172
it('is a test', () => {
  mount(<MyComponent name="some text" />)
  cy.contains('Hello').should('be.visible')
})
