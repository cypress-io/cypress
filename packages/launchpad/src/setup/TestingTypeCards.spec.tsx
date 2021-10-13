import {
  TestingTypeCardsFragmentDoc,
} from '../generated/graphql-test'
import TestingTypeCards from './TestingTypeCards.vue'
import { defaultMessages } from '@cy/i18n'

describe('TestingTypeCards', () => {
  it('renders correct label when no testingType has been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.app.activeProject) {
          result.app.activeProject.isFirstTimeCT = true
          result.app.activeProject.isFirstTimeE2E = true
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText(defaultMessages.setupPage.testingCard.notConfigured).should('have.length', 2)

      // TODO: Pullout to i18n
      cy.contains('Click here to configure end-to-end testing with Cypress.').should('be.visible')
    })
  })

  it('renders correct label when projects have been configured', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.app.activeProject) {
          result.app.activeProject.isFirstTimeCT = false
          result.app.activeProject.isFirstTimeE2E = false
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText('LAUNCH').should('have.length', 2)
      cy.findAllByText(defaultMessages.setupPage.testingCard.configured).should('have.length', 2)
    })
  })

  it('renders correct label when one project has been configured and the other has not', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      onResult: (result, ctx) => {
        if (result.app.activeProject) {
          result.app.activeProject.isFirstTimeCT = false
          result.app.activeProject.isFirstTimeE2E = true
        }
      },
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByText('LAUNCH').should('have.length', 1)
      cy.findAllByText(defaultMessages.setupPage.testingCard.configured).should('have.length', 1)
      cy.findAllByText(defaultMessages.setupPage.testingCard.notConfigured).should('have.length', 1)
      // TODO: Pullout to i18n
      cy.contains('Click here to configure end-to-end testing with Cypress.').should('be.visible')
    })
  })
})
