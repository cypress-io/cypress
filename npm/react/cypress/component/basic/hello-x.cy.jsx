import { HelloX } from './hello-x.jsx'
import React from 'react'
import { mount } from '@cypress/react'

describe('HelloX component', () => {
  it('works', () => {
    mount(<HelloX name="SuperMan" />)
    cy.contains('Hello SuperMan!')
  })

  it('renders Unicode', () => {
    mount(<HelloX name="🌎" />)
    cy.contains('Hello 🌎!')
    cy.wait(1000)
  })
})
