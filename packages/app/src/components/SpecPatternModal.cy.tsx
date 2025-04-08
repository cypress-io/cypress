import { SpecPatternModalFragmentDoc } from '../generated/graphql-test'
import SpecPatternModal from './SpecPatternModal.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<SpecPatternModal />', () => {
  it('should not render if closed', () => {
    cy.mountFragment(SpecPatternModalFragmentDoc, {
      render (gql) {
        return (<SpecPatternModal gql={gql} show={false} />)
      },
    })

    cy.get('[data-cy="spec-pattern-modal"]').should('not.exist')
  })

  it('should render and close', () => {
    const closeSpy = cy.stub().as('closeSpy')

    cy.mountFragment(SpecPatternModalFragmentDoc, {
      render (gql) {
        return (<SpecPatternModal gql={gql} show={true} onClose={closeSpy} />)
      },
    })

    cy.get('[data-cy="spec-pattern-modal"]').should('be.visible')
    cy.contains('h2', defaultMessages.components.specPatternModal.title)
    cy.get('[data-cy="external"]').should('have.attr', 'href').and('eq', 'https://on.cypress.io/test-type-options')
    cy.get('[data-cy="spec-pattern"]').should('be.visible')

    cy.percySnapshot()

    cy.get('[data-cy="open-config-file"]').should('be.visible')
    cy.contains('button', defaultMessages.createSpec.updateSpecPattern)

    cy.contains('button', defaultMessages.components.modal.dismiss).click()

    cy.get('@closeSpy').should('have.been.called')
  })
})
