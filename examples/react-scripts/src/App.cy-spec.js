/// <reference types="cypress" />
// compare to App.test.js
import React from 'react'
import App from './App'
import { mount } from 'cypress-react-unit-test'
import * as calc from './calc'
import * as Child from './Child'

describe('App', () => {
  it('renders learn react link', () => {
    mount(<App />)
    cy.contains(/Learn React/)
  })

  it('controls the random number by stubbing named import', () => {
    // we are stubbing "getRandomNumber" exported by "calc.js"
    // and imported into "App.js" and called.
    cy.stub(calc, 'getRandomNumber').returns(777)
    mount(<App />)
    cy.contains('.random', '777')

    // getRandomNumber was also used by the Child component
    // let's check that it was mocked too
    cy.contains('.child', 'Real child component, random 777')
  })

  it('can mock the child component', () => {
    // Child component we want to stub is the default export
    cy.stub(Child, 'default')
      .as('child')
      .returns(<div className="mock-child">Mock Child component</div>)
    mount(<App />)
    cy.contains('.mock-child', 'Mock Child')
  })
})
