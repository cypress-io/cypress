import * as React from 'react'
import { MyAwesomeComponent } from './MyAwesomeComponent'
import { mount } from 'cypress-react-unit-test'

describe('rollup for bundling components', () => {
  it('renders component processed by rollup', () => {
    mount(<MyAwesomeComponent />)

    cy.contains('My awesome component!')
  })
})
