/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import App from './App.jsx'

describe('App', () => {
  beforeEach(() => {
    // we need to clear the state before each test ourselves
    localStorage.clear('cart')
  })

  it('uses cart from localStorage', () => {
    const items = ['apples 🍎', 'oranges 🍊', 'grapes 🍇']
    localStorage.setItem('cart', JSON.stringify(items))
    mount(<App />)
    cy.get('.item').should('have.length', 3)
    cy.contains('.item', 'oranges 🍊').should('be.visible')
  })

  it('updates localStorage after adding an item to the cart', () => {
    mount(<App />)
    cy.contains('.item', 'kiwi 🥝').should('be.visible')
    cy.contains('Add juice').click()
    cy.contains('.item', 'juice 🧃')
    // and the new item should be added to localStorage
    // make an assertion retry so even if the localStorage
    // is updated after a delay, the assertion waits for it
    // https://on.cypress.io/retry-ability
    cy.wrap(localStorage)
      .invoke('getItem', 'cart')
      .should('equal', JSON.stringify(['kiwi 🥝', 'juice 🧃']))
  })
})
