/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Button } from './Button.jsx'

describe('Button', () => {
  it('can be orange', () => {
    mount(<Button name="Orange" orange />)

    cy.get('.component-button')
      .should('have.class', 'orange')
      .find('button')
      .should('have.css', 'background-color', 'rgb(245, 146, 62)')

    // for now disabled Percy in support commands
    // to make the bundles smaller and faster
    // cy.percySnapshot()
  })
})
