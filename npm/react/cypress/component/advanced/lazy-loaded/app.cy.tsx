import React from 'react'
import { mount } from '@cypress/react'
import App from './App'

describe('App loads', () => {
  it('renders lazy component', () => {
    mount(<App />)
    cy.contains('The Other')
  })
})
