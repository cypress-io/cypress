/// <reference types="cypress" />
import ShoppingList from './shopping-list.jsx'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

describe('Shopping list', () => {
  beforeEach(() => {
    cy.viewport(600, 400)
  })
  it('renders', () => {
    mount(<ShoppingList name="Mark" />)
    cy.contains('h1', 'Mark')
  })
})
