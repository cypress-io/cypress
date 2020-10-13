/// <reference types="cypress" />
import { mount } from 'cypress-react-unit-test'
import React from 'react'
import Select from './Note'

describe('Note', () => {
  it('save text', () => {
    mount(<Select />)
    cy.get('#change').type('input text')
    cy.contains('button', 'Save').click()
    cy.get('[data-testid=saved]').should('have.text', 'Saved: input text')
  })

  it('load data', () => {
    mount(<Select />)
    cy.contains('button', 'Load').click()
    // there is a built-in delay in loading the data
    // but we don't worry about it - we just check if the text eventually appears
    cy.get('[data-testid=item]')
      .should('have.length', 2)
      .and('be.visible')
      .first()
      .should('have.text', 'test')
  })
})
