import { mount } from '@cypress/react'
import React from 'react'
import App from './App.jsx'

it('works', () => {
  mount(<App />)
  cy.contains('Learn React')
})