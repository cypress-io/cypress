/// <reference types="../../lib" />

import React from 'react'
import ReactDom from 'react-dom'
import { mount } from '@cypress/react'
import Counter2WithHooks from './counter2-with-hooks.jsx'

describe('Counter2WithHooks', function () {
  it('changes document title', function () {
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
