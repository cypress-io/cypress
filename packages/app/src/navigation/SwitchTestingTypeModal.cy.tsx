import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import { SwitchTestingTypeModalFragmentDoc } from '../generated/graphql-test'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('SwitchTestingTypeModal', () => {
  it('renders the testing type cards in a modal', () => {
    // the testing type cards are tested on their own and via e2e tests,
    // so in this modal test, we just want to make sure they show up
    // and that the modal fires its close event.
    const closeSpy = cy.spy().as('closeSpy')

    cy.mountFragment(SwitchTestingTypeModalFragmentDoc, {
      onResult (result) {
        if (result.currentProject) {
          result.currentProject.isCTConfigured = true
          result.currentProject.isE2EConfigured = false
        }
      },
      render: (gql) => {
        return <SwitchTestingTypeModal gql={gql} show onClose={closeSpy} />
      },
    })

    cy.get('[data-cy="card"]').should('have.length', 2)
    cy.contains('h2', defaultMessages.testingType.modalTitle).should('be.visible')
    cy.get('[data-cy="switch-modal"] a').should('have.attr', 'href').and('eq', 'https://on.cypress.io/choosing-testing-type')
    cy.percySnapshot()

    cy.findByLabelText('Close')
    .focus()
    .type('{enter}')

    cy.get('@closeSpy').should('have.been.calledOnce')
  })
})
