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
          result.app.activeProject.isCTConfigured = false
          result.app.activeProject.isE2EConfigured = false
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
          result.app.activeProject.isCTConfigured = true
          result.app.activeProject.isE2EConfigured = true
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
          result.app.activeProject.isCTConfigured = true
          result.app.activeProject.isE2EConfigured = false
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

  it('emits an `openCompare` event when the question mark is clicked in cards', () => {
    cy.mountFragment(TestingTypeCardsFragmentDoc, {
      render: (gqlVal) => {
        return <TestingTypeCards gql={gqlVal} />
      },
    }).then(() => {
      cy.findAllByLabelText(defaultMessages.welcomePage.review).as('buttons')
      cy.get('@buttons').eq(0).click()
      cy.get('@buttons').eq(1).click().then(() =>
        cy.wrap(Cypress.vueWrapper.findComponent(TestingTypeCards).emitted('openCompare'))
        .should('have.length', 2))
    })
  })
})
