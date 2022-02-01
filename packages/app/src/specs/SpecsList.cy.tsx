import SpecsList from './SpecsList.vue'
import { Specs_SpecsListFragmentDoc, SpecsListFragment, TestingTypeEnum } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'

const rowSelector = '[data-cy=specs-list-row]'

function mountWithTestingType (testingType: TestingTypeEnum) {
  cy.mountFragment(Specs_SpecsListFragmentDoc, {
    onResult: (ctx) => {
      if (!ctx.currentProject) throw new Error('need current project')

      ctx.currentProject.currentTestingType = testingType

      return ctx
    },
    render: (gqlVal) => {
      return <SpecsList gql={gqlVal} />
    },
  })
}

let specs: Array<SpecsListFragment> = []

describe('<SpecsList />', { keystrokeDelay: 0 }, () => {
  context('when testingType is unset', () => {
    beforeEach(() => {
      const showCreateSpecModalSpy = cy.spy().as('showCreateSpecModalSpy')

      cy.mountFragment(Specs_SpecsListFragmentDoc, {
        onResult: (ctx) => {
          specs = ctx.currentProject?.specs || []

          return ctx
        },
        render: (gqlVal) => {
          return <SpecsList gql={gqlVal} onShowCreateSpecModal={showCreateSpecModalSpy} />
        },
      })
    })

    it('should filter specs', () => {
      // make sure things have rendered for snapshot
      // and that only a subset of the specs are displayed
      // (this means the virtualized list is working)

      cy.get('[data-cy="specs-list-row"]')
      .should('have.length.above', 2)
      .should('have.length.below', specs.length)

      cy.percySnapshot('full list')
      const longestSpec = specs.reduce((acc, spec) =>
        acc.relative.length < spec.relative.length ? spec : acc
      , specs[0])

      cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
      .as('specsListInput')

      cy.get('@specsListInput').type('garbage 🗑', { delay: 0 })
      .get(rowSelector)
      .should('not.exist')

      cy.contains(`${defaultMessages.specPage.noResultsMessage} garbage 🗑`)

      cy.percySnapshot('no results')

      cy.get('[data-cy="no-results-clear"]').click()
      cy.get('@specsListInput').invoke('val').should('be.empty')

      // validate that something re-populated in the specs list
      cy.get('[data-cy="specs-list-row"]').should('have.length.above', 2)

      cy.get('@specsListInput').type(longestSpec.fileName)
      cy.get(rowSelector).first().should('contain', longestSpec.relative.replace(`/${longestSpec.fileName}${longestSpec.specFileExtension}`, ''))
      cy.get(rowSelector).last().within(() => {
        cy.contains('a', longestSpec.baseName)
        .should('be.visible')
        .and('have.attr', 'href', `#/specs/runner?file=${longestSpec.relative}`)
      })

      const directory = longestSpec.relative.slice(0, longestSpec.relative.lastIndexOf('/'))

      cy.get('@specsListInput').clear().type(directory)
      cy.get(rowSelector).first().should('contain', directory)
      cy.percySnapshot('matching directory search')
    })

    it('should close directories with click', () => {
      // close all directories
      const directories: string[] = Array.from(new Set(specs.map((spec) => spec.relative.split('/')[0]))).sort()

      directories.forEach((dir) => {
        cy.contains('button[data-cy="row-directory-depth-0"]', dir)
        .should('have.attr', 'aria-expanded', 'true')
        .click()
        .should('have.attr', 'aria-expanded', 'false')
      })

      cy.get('[data-cy="spec-item"]').should('not.exist')
      cy.percySnapshot()
    })

    it('should close directories with Enter', () => {
      const directories: string[] = Array.from(new Set(specs.map((spec) => spec.relative.split('/')[0]))).sort()

      directories.forEach((dir) => {
        cy.contains('button[data-cy="row-directory-depth-0"]', dir)
        .should('have.attr', 'aria-expanded', 'true')
        .focus()
        .realPress('Enter')

        cy.contains('button[data-cy="row-directory-depth-0"]', dir)
        .should('have.attr', 'aria-expanded', 'false')
      })

      cy.get('[data-cy="spec-item"]').should('not.exist')
    })

    it('should close directories with Space', () => {
      const directories: string[] = Array.from(new Set(specs.map((spec) => spec.relative.split('/')[0]))).sort()

      directories.forEach((dir) => {
        cy.contains('button[data-cy="row-directory-depth-0"]', dir)
        .should('have.attr', 'aria-expanded', 'true')
        .focus()
        .realPress('Space')

        cy.contains('button[data-cy="row-directory-depth-0"]', dir)
        .should('have.attr', 'aria-expanded', 'false')
      })

      cy.get('[data-cy="spec-item"]').should('not.exist')
    })

    it('should emit an event to open new spec modal', () => {
      cy.contains(defaultMessages.createSpec.newSpec).click()
      cy.get('@showCreateSpecModalSpy').should('have.been.calledOnce')
    })
  })

  context('when testingType is e2e', () => {
    beforeEach(() => {
      mountWithTestingType('e2e')
    })

    it('should display the e2e testing header', () => {
      cy.get('[data-cy="specs-testing-type-header"]').should('have.text', 'E2E Specs')
    })
  })

  context('when testingType is component', () => {
    beforeEach(() => {
      mountWithTestingType('component')
    })

    it('should display the component testing header', () => {
      cy.get('[data-cy="specs-testing-type-header"]').should('have.text', 'Component Specs')
    })
  })
})
