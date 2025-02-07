import TestingTypePicker from './TestingTypePicker.vue'
import { TestingTypePickerFragmentDoc } from '../generated/graphql-test'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

const { component, e2e, componentDisabled } = defaultMessages.testingType

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
      cy.contains(e2e.name).should('be.visible')
      cy.contains(e2e.description).should('be.visible')
      cy.contains(defaultMessages.setupPage.testingCard.notConfigured).should('be.visible')
    })

    cy.get('[data-cy-testingtype="component"]').within(() => {
      cy.contains(component.name).should('be.visible')
      cy.contains(component.description).should('be.visible')
      cy.contains(defaultMessages.setupPage.testingCard.configured).should('be.visible')
    })

    cy.contains(e2e.name).click()
    cy.contains(component.name).click()
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
      cy.contains(component.name).should('be.visible')
      cy.contains(componentDisabled.description.replace('{0}', componentDisabled.link)).should('be.visible')
      cy.contains(defaultMessages.setupPage.testingCard.disabled).should('be.visible')

      cy.contains(componentDisabled.link).should('have.attr', 'href', 'https://on.cypress.io/installing-cypress')
    }).click()

    cy.get('@pick').should('not.have.been.called')
  })
})
