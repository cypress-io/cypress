import * as React from 'react'
import { Component } from './Component'
import * as calc from './calc'
import { mount } from 'cypress-react-unit-test'

// import the component and the file it imports
// stub the method on the imported "calc" and
// confirm the component renders the mock value
describe('Component', () => {
  it('mocks call from the component', () => {
    cy.stub(calc, 'getRandomNumber').returns(777)

    mount(<Component />)

    cy.get('.random').contains('777')
  })
})
