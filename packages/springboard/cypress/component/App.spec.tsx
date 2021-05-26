import React from 'react'
import { mount } from '@cypress/react'

import { App } from '../../src/App'

describe('App', () => {
  it('renders', () => {
    mount(<App />)
    cy.get('div').contains('Welcome to the app!')
  })
})
