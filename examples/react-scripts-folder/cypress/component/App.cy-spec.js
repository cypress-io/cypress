/// <reference types="cypress" />
// compare to App.test.js
import React from 'react'
import App from '../../src/App'
import { mount } from 'cypress-react-unit-test'

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
})
