import React from 'react'
import { MissingReact } from './MissingReact'

it('is missing React', () => {
  cy.mount(<MissingReact />)
  cy.get('h1').contains('Missing React')
})
