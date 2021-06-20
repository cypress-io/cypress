/// <reference types="../../lib" />

import React from 'react'
import ReactDom from 'react-dom'
import { mount } from '@cypress/react'
import Counter2WithHooks from './counter2-with-hooks.jsx'

describe('0 describe', function () {
  it('0.1 it', function () {
    expect(true).to.be(false)
    mount(<Counter2WithHooks />, { React, ReactDom })
    cy.contains('0')
    cy.document().should('have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })

  describe('0.1 describe', () => {
    describe('0.0.1 describe', () => {
      it('0.0.1 it', function () {
    mount(<Counter2WithHooks />, { React, ReactDom })
    cy.contains('0')
    cy.document().should('not.have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })
      describe('0.0.0.1 describe', () => {
        it('0.0.0.1 it', () => {

        })
      })  
    })  
  })
  it('0.2 it', function () {
    mount(<Counter2WithHooks />, { React, ReactDom })
    cy.contains('0')
    cy.document().should('have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })

  it('0.3 it', function () {
    mount(<Counter2WithHooks />, { React, ReactDom })
    cy.contains('0')
    cy.document().should('have.property', 'title', 'You clicked 0 times')

    cy.log('Clicking changes document title')
    cy.get('#increment')
    .click()
    .click()

    cy.document().should('have.property', 'title', 'You clicked 2 times')
  })
})
