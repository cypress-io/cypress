import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('components', () => {
  it('works', () => {
    mount(<div>Text</div>)
    cy.contains('Text')
  })
})
