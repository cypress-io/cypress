/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import ShoppingList from './shopping-list.jsx'

describe('Shopping list', () => {
  beforeEach(() => {
    cy.viewport(600, 600)
  })

  it('shows FB list', () => {
    mount(<ShoppingList name="Facebook" />)
    cy.get('li').should('have.length', 3)
  })
})
