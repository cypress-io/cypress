/// <reference types="cypress" />
import 'cypress-react-selector'
import { mount } from 'cypress-react-unit-test'
import React from 'react'
import ProductsList from './ProductsList.jsx'

// test similar to
// https://github.com/softchris/react-book/blob/7bd767bb39f59977b107d07f383a8f4e32a12857/Testing/test-demo/src/Components/__tests__/ProductsList.js
describe('Selecting by React props and state', () => {
  beforeEach(() => {
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

    // use https://github.com/abhinaba-ghosh/cypress-react-selector
    // to find DOM elements by React component constructor name, props, or state
    cy.waitForReact(1000, '#cypress-root')
  })

  it('renders products', () => {
    // query the DOM elements
    cy.contains('First item').should('be.visible')
    cy.get('.product').should('have.length', 2)
  })

  it('finds DOM elements using React component name and props', () => {
    cy.log('**cy.react**')
    // find the top level <ProductsContainer> that we have mounted
    // under imported name "ProductsList"
    cy.react('ProductsContainer').should('have.class', 'product-container')
    // for more ways to find components, see
    // https://github.com/abhinaba-ghosh/cypress-react-selector#how-to-use-react-selector
    // find all instances of <AProduct> component
    cy.react('AProduct').should('have.length', 2)
    // find a single instance with prop
    // <AProduct name={'Second item'} />
    cy.react('AProduct', { name: 'Second item' })
      .should('be.visible')
      .and('have.text', 'Second item')
  })

  it('find React components', () => {
    cy.log('**cy.getReact**')
    // returns React component wrapper with props
    cy.getReact('AProduct', { name: 'Second item' })
      .getProps()
      .should('deep.equal', { name: 'Second item' })
    cy.getReact('AProduct', { name: 'First item' })
      // get single prop
      .getProps('name')
      .should('eq', 'First item')
    cy.log('**.getCurrentState**')
    cy.getReact('AProduct', { name: 'Second item' })
      .getCurrentState()
      .should('deep.equal', { myName: 'Second item' })

    // find component using state
    cy.getReact('AProduct', null, { myName: 'Second item' }).should('exist')
  })

  // SKIP: https://github.com/bahmutov/cypress-react-unit-test/issues/378
  it.skip('chains getReact', () => {
    // note that by itself, the component is found
    cy.getReact('AProduct', { name: 'First item' })
      .getProps('name')
      .should('eq', 'First item')

    // chaining getReact
    cy.getReact('ProductsContainer')
      .should('not.be.empty')
      // the second .getReact returns nothing
      .getReact('AProduct', { name: 'First item' })
      .getProps('name')
      .should('eq', 'First item')
  })
})
