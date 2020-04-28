/// <reference types="cypress" />
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
        products: [{ id: 1, name: 'Mocked data' }],
      }),
    })
  mount(<ProductsList />)
  cy.contains('Mocked data').should('be.visible')
})
