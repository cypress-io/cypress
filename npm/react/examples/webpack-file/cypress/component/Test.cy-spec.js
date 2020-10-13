import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Test from './Test'

describe('components', () => {
  it('works', () => {
    mount(<Test />)
    cy.contains('Text')
  })

  it('works with plain div', () => {
    mount(<div>Text</div>)
    cy.contains('Text')
  })
})
