/// <reference types="cypress" />
// import * as React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Search } from '../../components/Search'

describe('<Search /> NextJS component', () => {
  it('Renders component', () => {
    mount(<Search />)

    cy.get('input').type('124152')
    cy.contains('.search-text', '124152').should('be.visible')
  })
})
