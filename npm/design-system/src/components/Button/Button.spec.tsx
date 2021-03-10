import React from 'react'
import { mount } from '@cypress/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders', () => {
    mount(<Button />)
    cy.get('button').should('exist')
  })
})
