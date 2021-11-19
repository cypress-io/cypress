import SpecsList from './SpecsList.vue'
import { Specs_SpecsListFragmentDoc, SpecNode_SpecsListFragment } from '../generated/graphql-test'

const rowSelector = '[data-testid=specs-list-row]'
const inputSelector = 'input'

let specs: Array<SpecNode_SpecsListFragment> = []

describe('<SpecsList />', { keystrokeDelay: 0 }, () => {
  beforeEach(() => {
    cy.mountFragment(Specs_SpecsListFragmentDoc, {
      onResult: (ctx) => {
        specs = ctx.currentProject?.specs?.edges || []

        return ctx
      },
      render: (gqlVal) => {
        return <SpecsList gql={gqlVal} />
      },
    })
  })

  it('should filter specs', () => {
    const spec = specs[0].node

    cy.get(inputSelector).type('garbage 🗑', { delay: 0 })
    .get(rowSelector)
    .should('not.exist')

    cy.get(inputSelector).clear().type(spec.relative)
    cy.get(rowSelector).first().should('contain', spec.relative.replace(`/${spec.fileName}${spec.specFileExtension}`, ''))
    cy.get(rowSelector).last().should('contain', `${spec.fileName}${spec.specFileExtension}`)
  })

  it('should close directories', () => {
    // close all directories
    ['src', 'packages', 'frontend', '__test__', 'lib', 'tests'].forEach((dir) => {
      cy.get('[data-cy="row-directory-depth-0"]').contains(dir).click()
    })

    // all directories closed; no specs should be showing.
    cy.get('[data-cy="spec-item"]').should('not.exist')
  })
})
