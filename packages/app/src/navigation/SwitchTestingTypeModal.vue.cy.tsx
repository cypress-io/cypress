import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import { SwitchTestingTypeModalFragmentDoc } from '../generated/graphql-test'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these

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
    cy.contains('h2', 'Choose a testing type').should('be.visible')
    cy.get('[data-cy="switch-modal"] a').should('have.attr', 'href').then((href) => {
      const url = new URL(String(href))

      expect(`${url.origin}${url.pathname}`).to.eq('https://on.cypress.io/choosing-testing-type')
      expect(url.searchParams.get('utm_medium')).to.eq('Switch Testing Type Modal')
      expect(url.searchParams.get('utm_campaign')).to.eq('Need help')
      expect(url.searchParams.get('utm_source')).to.eq(getUtmSource())
    })

    cy.percySnapshot()

    cy.findByLabelText('Close')
    .focus()
    .type('{enter}')

    cy.get('@closeSpy').should('have.been.calledOnce')
  })
})
