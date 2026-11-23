import TestingTypePicker from './TestingTypePicker.vue'
import { TestingTypePickerFragmentDoc } from '../generated/graphql-test'

describe('TestingTypePicker', () => {
  it('renders "configured" and "not configured" states', () => {
    const pick = cy.spy().as('pick')

    cy.mountFragment(TestingTypePickerFragmentDoc, {
      onResult (result) {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = true
          result.currentProject.isE2EConfigured = false
        }
      },
      render: (gql) => {
        return <TestingTypePicker gql={gql} onPick={pick}/>
      },
    })

    cy.get('[data-cy-testingtype="e2e"]').within(() => {
      cy.contains('E2E Testing').should('be.visible')
      cy.contains('Build and test the entire experience of your application from end-to-end to ensure each flow matches your expectations.').should('be.visible')
      cy.contains('Not Configured').should('be.visible')
    })

    cy.get('[data-cy-testingtype="component"]').within(() => {
      cy.contains('Component Testing').should('be.visible')
      cy.contains('Build and test your components from your design system in isolation in order to ensure each state matches your expectations.').should('be.visible')
      cy.contains('Configured').should('be.visible')
    })

    cy.contains('E2E Testing').click()
    cy.contains('Component Testing').click()
    cy.get('@pick').should('have.been.calledTwice')
  })

  it('shows disabled ct when not invoked from cli', () => {
    cy.mountFragment(TestingTypePickerFragmentDoc, {
      onResult (result) {
        result.invokedFromCli = false
      },
      render: (gql) => {
        return <TestingTypePicker gql={gql} onPick={cy.spy().as('pick')}/>
      },
    })

    cy.get('[data-cy-testingtype="component"]').within(() => {
      cy.contains('Component Testing').should('be.visible')
      cy.contains('To test your components you must install Cypress as an NPM dependency for this project.').should('be.visible')
      cy.contains('Disabled').should('be.visible')

      cy.contains('install Cypress').should('have.attr', 'href', 'https://on.cypress.io/installing-cypress')
    }).click()

    cy.get('@pick').should('not.have.been.called')
  })
})
