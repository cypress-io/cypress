/// <reference types="cypress" />
import * as React from 'react'
import { mount } from 'cypress-react-unit-test'
import { Search } from '../../components/Search'
import HelloWorld from '../../components/HelloWorld.mdx'

describe('<Search /> NextJS component', () => {
  it('Renders component', () => {
    mount(<Search />)

    cy.get('input').type('124152')
    cy.contains('.search-text', '124152').should('be.visible')
  })

  it('Renders mdx component using  custom next.config.js', () => {
    mount(<HelloWorld />)

    cy.contains('Hello').should('have.css', 'fontWeight', '700')
    cy.contains('This is JSX')
      .parent()
      .should('have.css', 'background-color', 'rgb(255, 99, 71)')
  })
})
