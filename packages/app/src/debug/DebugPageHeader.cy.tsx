import { DebugPageFragmentDoc } from '../generated/graphql-test'
import DebugPageHeader from './DebugPageHeader.vue'

// const generateTags = (num): any => new Array(num).fill(null).map((_, i) => ({ id: `${i}`, name: `tag${i}`, __typename: 'CloudRunTag' }))

const defaults = [
  { attr: 'debug-header-branch', text: 'Branch Name: feature/DESIGN-183' },
  { attr: 'debug-header-commitHash', text: 'Commit Hash: b5e6fde' },
  { attr: 'debug-header-author', text: 'Commit Author: ankithmehta' },
  { attr: 'debug-header-createdAt', text: 'Run Total Duration: 10m 30s (43m ago)' },
]

describe('<DebugPageHeader />', {
  viewportWidth: 1032,
},
() => {
  describe('renders with all default run information', () => {
    it('displays all default values', () => {
      cy.mount(<DebugPageHeader/>)
      cy.get('[data-cy=debug-header-3]').children().should('have.length', 2)
      cy.get('[data-cy=debug-test-summary]')
      .should('have.css', 'color', 'rgb(46, 50, 71)')
      .should('have.text', 'Adding a hover state to the button component')

      cy.get('[data-cy=debug-runCommit-info]').children().should('have.length', 2)
      cy.get('[data-cy=debug-runNumber]')
      .should('have.text', 'Run #468')
      .should('have.css', 'color', 'rgb(90, 95, 122)')

      cy.get('[data-cy=debug-commitsAhead]')
      .should('have.text', 'You are 2 commits ahead')
      .should('have.css', 'color', 'rgb(189, 88, 0)')

      cy.get('[data-cy=debug-results]').should('be.visible')

      defaults.forEach((obj) => {
        cy.get(`[data-cy=${obj.attr}]`)
        .should('have.text', obj.text)
        .children().should('have.length', 2)
      })
    })

    // cy.percySnapshot()
  })

  describe('does not display items when they dont exist', () => {
  })

  context('does not show component with null values', () => {
    beforeEach(() => {
      cy.mountFragment(DebugPageFragmentDoc, {
        render: (gqlVal) => {
          return (
            <DebugPageHeader gql={gqlVal} />
          )
        },
      })
    })
  })
})

// passing in props i.e. graphQL
// checking if items are null
