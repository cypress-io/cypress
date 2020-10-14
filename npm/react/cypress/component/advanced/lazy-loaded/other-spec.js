import React from 'react'
import { mount } from '@cypress/react'
import OtherComponent from './OtherComponent'

describe('Other component by itself', () => {
  it('renders', () => {
    mount(<OtherComponent />)
    cy.contains('The Other')
  })
})
