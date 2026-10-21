import React from 'react'
import { mount } from '@cypress/react'
import Component from './component'

describe('Component with imported greeting', () => {
  it('shows real greeting', () => {
    mount(<Component />)
    cy.contains('h1', 'real greeting').should('be.visible')
  })
})
