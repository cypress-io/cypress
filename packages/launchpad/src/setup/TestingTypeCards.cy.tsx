import {
  TestingTypeCardsFragmentDoc,
} from '../generated/graphql-test'
import TestingTypeCards from './TestingTypeCards.vue'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'

describe('TestingTypeCards', () => {
  it('renders correct label when no testingType has been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = false
          result.currentProject.isE2EConfigured = false
          result.currentProject.currentTestingType = null
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText(defaultMessages.setupPage.testingCard.notConfigured).should('have.length', 2)

      cy.contains('Build and test the entire experience of your application').should('be.visible')
      cy.contains('Build and test your components from your design system in isolation in order to ensure each state matches your expectations.').should('be.visible')
    })
  })

  it('renders correct label when projects have been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = true
          result.currentProject.isE2EConfigured = true
          result.currentProject.currentTestingType = null
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText(defaultMessages.setupPage.testingCard.configured).should('have.length', 2)
      cy.contains('Build and test the entire experience of your application').should('be.visible')
      cy.contains('Build and test your components from your design system in isolation in order to ensure each state matches your expectations.').should('be.visible')
    })
  })

  it('renders correct label when one project has been configured and the other has not', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = true
          result.currentProject.isE2EConfigured = false
          result.currentProject.currentTestingType = null
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText(defaultMessages.setupPage.testingCard.configured).should('have.length', 1)
      cy.findAllByText(defaultMessages.setupPage.testingCard.notConfigured).should('have.length', 1)

      cy.contains('Build and test the entire experience of your application').should('be.visible')
      cy.contains('Build and test your components from your design system in isolation in order to ensure each state matches your expectations.').should('be.visible')
    })
  })

  it('renders correct label if project is initialized', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = true
          result.currentProject.isE2EConfigured = true
          result.currentProject.currentTestingType = 'component'
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    })

    cy.contains('Build and test the entire experience of your application').should('be.visible')
    cy.contains('Build and test your components from your design system in isolation in order to ensure each state matches your expectations.').should('be.visible')
    cy.findAllByText(defaultMessages.setupPage.testingCard.configured).should('have.length', 1)
    cy.findAllByText(defaultMessages.setupPage.testingCard.running).should('have.length', 1)
  })
})
