/// <reference types="cypress" />
// compare to App.test.js
import React from 'react'
import App from './App'
import { mount } from 'cypress-react-unit-test'

describe('App', () => {
  it('renders learn react link', () => {
    mount(<App />)
    cy.contains(/Learn React/)
  })
})
