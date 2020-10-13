/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Component from './Component.jsx'
import * as calc from './calc'

// import the component and the file it imports
// stub the method on the imported "calc" and
// confirm the component renders the mock value
describe('Component', () => {
  it('mocks call from the component', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)
    mount(<Component />)
  })
})
