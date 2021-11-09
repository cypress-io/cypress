import {
  TestingTypeCardsFragmentDoc,
} from '../generated/graphql-test'
import TestingTypeCards from './TestingTypeCards.vue'
import { defaultMessages } from '@cy/i18n'

describe('TestingTypeCards', () => {
  it('renders correct label when no testingType has been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = false
          result.currentProject.isE2EConfigured = false
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText(defaultMessages.setupPage.testingCard.notConfigured).should('have.length', 2)

      cy.contains('Build and test the entire experience of your application').should('be.visible')
    })
  })

  it('renders correct label when projects have been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = true
          result.currentProject.isE2EConfigured = true
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText(defaultMessages.setupPage.testingCard.configured).should('have.length', 2)
    })
  })

  it('renders correct label when one project has been configured and the other has not', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = true
          result.currentProject.isE2EConfigured = false
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText(defaultMessages.setupPage.testingCard.configured).should('have.length', 1)
      cy.findAllByText(defaultMessages.setupPage.testingCard.notConfigured).should('have.length', 1)

      cy.contains('Build and test the entire experience of your application').should('be.visible')
    })
  })
})
