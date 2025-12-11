import React from 'react'
import { Button } from './button'

it('works', () => {
  cy.mount(<Button />)
  cy.get('button').contains('Hello World')
})
