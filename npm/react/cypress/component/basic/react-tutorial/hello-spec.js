/// <reference types="cypress" />
import Hello from './hello.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

it('says hello to different people', () => {
  mount(<Hello />)
  cy.contains('Hey, stranger')

  mount(<Hello name="Jenny" />)
  cy.contains('Hello, Jenny!')

  mount(<Hello name="Margaret" />)
  cy.contains('Hello, Margaret!')
})
