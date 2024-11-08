import React from 'react'
import { mount } from 'cypress/react'
import { Button } from './button'

it('works', () => {
  mount(<Button />)
  cy.get('button').contains('Hello World')
})
