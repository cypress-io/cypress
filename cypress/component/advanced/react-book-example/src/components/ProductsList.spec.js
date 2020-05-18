/// <reference types="cypress" />
import 'cypress-react-selector'
import { mount } from 'cypress-react-unit-test'
import React from 'react'
import ProductsList from './ProductsList.jsx'

// test similar to
// https://github.com/softchris/react-book/blob/7bd767bb39f59977b107d07f383a8f4e32a12857/Testing/test-demo/src/Components/__tests__/ProductsList.js
it('renders without crashing', () => {
  cy.stub(window, 'fetch')
    .withArgs('http://myapi.com/products')
    .resolves({
      json: cy.stub().resolves({
        products: [
          { id: 1, name: 'First item' },
          { id: 2, name: 'Second item' },
        ],
      }),
    })
  mount(<ProductsList />)
  cy.contains('First item').should('be.visible')
  cy.get('.product').should('have.length', 2)

  // use https://github.com/abhinaba-ghosh/cypress-react-selector
  // to find DOM elements by React component constructor name or state
  cy.waitForReact(1000, '#cypress-root')
  cy.react('ProductsContainer').should('have.class', 'product-container')
  cy.react('AProduct').should('have.length', 2)
  cy.react('AProduct', { name: 'Second item' })
    .should('be.visible')
    .and('have.text', 'Second item')
  cy.getReact('AProduct', { name: 'Second item' })
    .getProps()
    .should('have.property', 'name')
  cy.getReact('AProduct', { name: 'First item' })
    .getProps('name')
    .should('eq', 'First item')
  cy.getReact('AProduct', { name: 'Second item' })
    .getCurrentState()
    .should('not.empty')
})
