/// <reference types="cypress" />
import HelloWorld from './stateless-alert.jsx'
import React from 'react'
import ReactDom from 'react-dom'
import { mount } from 'cypress-react-unit-test'

describe('Stateless alert', () => {
  beforeEach(() => {
    const spy = cy.spy().as('alert')
    cy.on('window:alert', spy)
    mount(<HelloWorld name="React" />, { ReactDom })
  })

  it('shows link', () => {
    cy.contains('a', 'Say Hi')
  })

  it('alerts with name', () => {
    cy.contains('Say Hi').click()
    cy.get('@alert')
      .should('have.been.calledOnce')
      .and('have.been.be.calledWithExactly', 'Hi React')
  })
})
