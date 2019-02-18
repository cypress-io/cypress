/// <reference types="cypress" />
/// <reference types="../../lib" />
import React from 'react'
const HelloWorld = () => <p>Hello World!</p>
describe('HelloWorld component', () => {
  it('works', () => {
    cy.mount(<HelloWorld />)
    cy.contains('Hello World!')
  })
})
