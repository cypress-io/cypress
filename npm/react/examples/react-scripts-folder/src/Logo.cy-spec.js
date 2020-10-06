/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
// import SVG as ReactComponent
import { ReactComponent as Logo } from './logo.svg'

describe('Logo', () => {
  it('imports SVG', () => {
    mount(<Logo />)
    cy.get('path').should('have.attr', 'd')
  })
})
