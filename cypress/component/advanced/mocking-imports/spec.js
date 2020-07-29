/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Component from './component'
import * as GreetingModule from './greeting'

describe('Mocking ES6 import', () => {
  it('shows real greeting', () => {
    mount(<Component />)
    cy.contains('h1', 'real greeting').should('be.visible')
  })

  it('shows mock greeting', () => {
    // stubbing ES6 named imports works via
    // @babel/plugin-transform-modules-commonjs with "loose: true"
    // because the generated properties are configurable

    // stub property on the loaded ES6 module using cy.stub
    // which will be restored after the test automatically
    cy.stub(GreetingModule, 'greeting', 'test greeting')
    mount(<Component />)
    cy.contains('h1', 'test greeting').should('be.visible')
  })

  it('shows real greeting again', () => {
    mount(<Component />)
    cy.contains('h1', 'real greeting').should('be.visible')
  })
})
