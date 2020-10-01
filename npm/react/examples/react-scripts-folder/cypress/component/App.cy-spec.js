/// <reference types="cypress" />
// compare to App.test.js
import React from 'react'
import App from '../../src/App'
import { mount } from 'cypress-react-unit-test'
import * as calc from '../../src/calc'
import * as child from '../../src/Child'

describe('App', () => {
  it('renders learn react link', () => {
    expect(1).to.equal(1)
    mount(<App />)
    cy.contains(/Learn React/)
  })

  it('renders inline component', () => {
    mount(<div>JSX</div>)
    cy.contains('JSX')
  })

  it('controls the random number by stubbing named import', () => {
    // we are stubbing "getRandomNumber" exported by "calc.js"
    // and imported into "App.js" and called.
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)
    mount(<App />)
    cy.contains('.random', '777')
    cy.get('@lucky').should('be.calledOnce')
  })

  it('stubs an imported child component', () => {
    cy.stub(child, 'Child')
      .as('child')
      .returns(<div className="mock-child">Mock child component</div>)
    mount(<App />)
    // App component rendered our mock child component!
    cy.contains('Mock child component')
    cy.get('@child').should('have.been.calledTwice')
    cy.get('.mock-child').should('have.length', 2)
  })
})
