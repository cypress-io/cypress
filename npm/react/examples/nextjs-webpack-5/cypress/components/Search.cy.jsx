/// <reference types="cypress" />
import * as React from 'react'
import * as ReactDom from 'react-dom'
import { mount } from '@cypress/react'
import { Search } from '../../components/Search'

describe('<Search /> NextJS component', () => {
  it('Renders component', () => {
    mount(<Search />, {
      ReactDom,
    })

    cy.get('input').type('124152')
    cy.contains('.search-text', '124152').should('be.visible')
  })
})
