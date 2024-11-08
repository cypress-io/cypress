import React from 'react'
import { mount } from 'cypress/react18'
import { Button } from './button'

it('works', () => {
  mount(<Button />)
  cy.get('button').contains('Hello World')
})
