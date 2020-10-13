/// <reference types="cypress" />
import * as React from 'react'
import IndexPage from '../../pages/index'
import { mount } from 'cypress-react-unit-test'

describe('NextJS page', () => {
  it('Renders page component', () => {
    mount(<IndexPage />)

    cy.contains('Welcome to Next.js')
    cy.get('[aria-label=search]').type('Cypress')
    cy.contains('.search-text', 'You are searching for: Cypress')
  })

  it("It doesn't run the `.getInitialProps()`", () => {
    mount(<IndexPage />)

    cy.get('[data-testid="server-result"').should(
      'not.contain',
      '`.getInitialProps()` was called and passed props to this component',
    )
  })

  it('Allows to manually mock the server side props', () => {
    mount(<IndexPage asyncProp />)

    cy.contains(
      '`.getInitialProps()` was called and passed props to this component',
    )
  })

  it('can be tested with real .getInitialProps call', () => {
    IndexPage.getInitialProps().then(props => {
      mount(<IndexPage {...props} />)
    })

    cy.contains(
      '`.getInitialProps()` was called and passed props to this component',
    )
  })
})
