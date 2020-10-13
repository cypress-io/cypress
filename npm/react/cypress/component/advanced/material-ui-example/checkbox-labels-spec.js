import React from 'react'
import { mount } from 'cypress-react-unit-test'
import CheckboxLabels from './checkbox-labels'

it('renders checkboxes', () => {
  cy.viewport(600, 600)
  mount(<CheckboxLabels />)
})
