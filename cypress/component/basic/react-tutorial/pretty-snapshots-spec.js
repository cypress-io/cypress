/// <reference types="cypress" />
import Hello from './hello.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import pretty from 'pretty'

it('says hello world', () => {
  mount(<Hello name="world" />)
  cy.contains('Hello, world!').should('be.visible')
  cy.get('#cypress-root')
    .invoke('html')
    .then(pretty)
    .should('equal', '<h1>Hello, world!</h1>')
})
