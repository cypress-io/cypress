/// <reference types="cypress" />
import { mount } from 'cypress-react-unit-test'
import React from 'react'
import ProductsList from './ProductsList.jsx'

// test similar to
// https://github.com/softchris/react-book/blob/7bd767bb39f59977b107d07f383a8f4e32a12857/Testing/test-demo/src/Components/__tests__/ProductsList.js
describe('Selecting by React props and state', () => {
  context('without delay', () => {
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

      // to find DOM elements by React component constructor name, props, or state
      cy.waitForReact()
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
      cy.react('ProductsContainer')
        .first()
        .should('have.class', 'product-container')
      // find all instances of <AProduct> component
      cy.react('AProduct').should('have.length', 2)
      // find a single instance with prop
      // <AProduct name={'Second item'} />
      cy.react('AProduct', { props: { name: 'Second item' } })
        .first()
        .find('.name')
        .and('have.text', 'Second item')
    })

    it('find React components', () => {
      cy.log('**cy.getReact**')
      // returns React component wrapper with props
      cy.getReact('AProduct', { props: { name: 'Second item' } })
        .getProps()
        .should('deep.equal', { name: 'Second item' })
      cy.getReact('AProduct', { props: { name: 'First item' } })
        // get single prop
        .getProps('name')
        .should('eq', 'First item')
      cy.log('**.getCurrentState**')
      cy.getReact('AProduct', { props: { name: 'Second item' } })
        .getCurrentState()
        .should('include', { myName: 'Second item' })

      // find component using state
      cy.getReact('AProduct', { state: { myName: 'Second item' } }).should(
        'exist',
      )
    })

    it('chains getReact', () => {
      // note that by itself, the component is found
      cy.getReact('AProduct', { props: { name: 'First item' } })
        .getProps('name')
        .should('eq', 'First item')

      // chaining getReact
      cy.getReact('ProductsContainer')
        .getReact('AProduct', { props: { name: 'First item' } })
        .getProps('name')
        .should('eq', 'First item')
    })

    it('finds components by props and state', () => {
      // by clicking on the Order button we change the
      // internal state of that component
      cy.contains('.product', 'First item')
        .find('button.order')
        .click()
        .wait(1000)

      // the component is there for sure, since the DOM has updated
      cy.contains('.product', '1')
        .find('.name')
        .should('have.text', 'First item')

      // now find that component using the state value
      cy.react('AProduct', { state: { orderCount: 1 } })
        .find('.name')
        .should('have.text', 'First item')
    })

    it('finds components by props and state (click twice)', () => {
      // by clicking on the Order button we change the
      // internal state of that component
      cy.contains('.product', 'First item')
        .find('button.order')
        .click()
        .click()

      // now find that component using the state value
      cy.react('AProduct', { state: { orderCount: 2 } })
        .find('.name')
        .should('have.text', 'First item')
    })
  })

  context('with delay', () => {
    it('retries until component is found', () => {
      // or the command times out
      const products = [
        { id: 1, name: 'First item' },
        { id: 2, name: 'Second item' },
      ]
      const response = {
        json: cy.stub().resolves({
          products,
        }),
      }

      cy.stub(window, 'fetch')
        .withArgs('http://myapi.com/products')
        // simulate slow load by delaying the response
        .resolves(Cypress.Promise.resolve(response).delay(1000))
      mount(<ProductsList />)

      // to find DOM elements by React component constructor name, props, or state
      cy.waitForReact()
      // cy.react should requery the elements until
      // the assertions that follow it are satisfied,
      // or, if there are no assertions, that an element is found
      cy.react('AProduct', {
        props: { name: 'Second item' },
      }).should('have.length', '1')
    })
  })
})
