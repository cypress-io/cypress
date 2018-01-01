import { HelloX, HelloState } from '../../src/hello-x.jsx'
import React from 'react'
import { mount } from '../../lib'

/* eslint-env mocha */
describe('HelloX component', () => {
  it('works', () => {
    mount(<HelloX name="SuperMan" />)
    cy.contains('Hello SuperMan!')
  })
})

describe('HelloState component', () => {
  it('works', () => {
    mount(<HelloState />)
    cy.contains('Hello Spider-man!').then(() => {
      Cypress.component.setState({ name: 'React' })
    })
    cy.contains('Hello React!')
  })
})
