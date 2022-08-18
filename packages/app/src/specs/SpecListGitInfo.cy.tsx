import { SpecListRowFragmentDoc } from '../generated/graphql-test'
import SpecListGitInfo from './SpecListGitInfo.vue'

describe('SpecListGitInfo', () => {
  const mountWithStatus = (status: 'created' | 'modified' | 'unmodified') => {
    cy.mountFragment(SpecListRowFragmentDoc, {
      onResult: (ctx) => {
        ctx.author = 'Bob'
        ctx.lastModifiedHumanReadable = 'Last Tuesday'
        ctx.lastModifiedTimestamp = new Date('02-02-2022').toISOString()
        ctx.statusType = status
        ctx.shortHash = 'abc123'
        ctx.subject = 'chore: did stuff'
      },
      render: (gql) => <SpecListGitInfo gql={gql} />,
    })

    cy.findByTestId('git-info-row').as('row')
  }

  context('created', () => {
    beforeEach(() => {
      mountWithStatus('created')
    })

    it('renders created icon and expected text', () => {
      cy.get('@row').should('have.text', 'Last Tuesday')
      cy.findByTestId('created-icon').should('be.visible')
    })

    it('provides expected tooltip content', () => {
      cy.findByTestId('git-info-tooltip').should('not.exist')
      cy.get('.v-popper').trigger('mouseenter')
      cy.findByTestId('git-info-tooltip').should('be.visible')
      .and('have.text', 'Created')

      /*
        TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
        cy.percySnapshot()
      */
    })
  })

  context('modified', () => {
    beforeEach(() => {
      mountWithStatus('modified')
    })

    it('renders created icon and expected text', () => {
      cy.get('@row').should('have.text', 'Last Tuesday')
      cy.findByTestId('modified-icon').should('be.visible')
    })

    it('provides expected tooltip content', () => {
      cy.findByTestId('git-info-tooltip').should('not.exist')
      cy.get('.v-popper').trigger('mouseenter')
      cy.findByTestId('git-info-tooltip').should('be.visible')
      .and('have.text', 'Modified')
      /*
        TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
        cy.percySnapshot()
      */
    })
  })

  context('unmodified', () => {
    beforeEach(() => {
      mountWithStatus('unmodified')
    })

    it('renders created icon and expected text', () => {
      cy.get('@row').should('have.text', 'Last Tuesday')
      cy.findByTestId('unmodified-icon').should('be.visible')
    })

    it('provides expected tooltip content', () => {
      cy.findByTestId('git-info-tooltip').should('not.exist')
      cy.get('.v-popper').trigger('mouseenter')
      cy.findByTestId('git-info-tooltip').should('be.visible')
      .and('contain', 'chore: did stuff')
      .and('contain', 'abc123 by Bob')

      /*
        TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
        cy.percySnapshot()
      */
    })
  })
})
