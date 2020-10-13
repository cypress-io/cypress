/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import ParentComponent from './ParentComponent'
import * as calc from './calc'
import * as ChildComponent from './ChildComponent'

describe('Mocking', () => {
  it('named getRandomNumber imported in the child component', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)
    mount(<ParentComponent />)
    cy.contains('.random', '777')
  })

  it('entire child component exported as default', () => {
    cy.stub(ChildComponent, 'default')
      .as('child')
      .returns(<div className="mock-child">Mock child component</div>)
    mount(<ParentComponent />)
    cy.contains('.mock-child', 'Mock child component')
  })
})
