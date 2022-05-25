import React from 'react'
import { mount } from 'cypress/react'
import { MissingReact } from './MissingReact'

it('is missing React', () => {
  mount(<MissingReact />)
  cy.get('h1').contains('Missing React')
})
