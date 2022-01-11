import SpecsList from './SpecsList.vue'
import { Specs_SpecsListFragmentDoc, SpecNode_SpecsListFragment, TestingTypeEnum } from '../generated/graphql-test'

const rowSelector = '[data-testid=specs-list-row]'
const inputSelector = 'input'

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

let specs: Array<SpecNode_SpecsListFragment> = []

describe('<SpecsList />', { keystrokeDelay: 0 }, () => {
  context('when testingType is unset', () => {
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
      const longestSpec = specs.reduce((acc, spec) =>
        acc.node.relative.length < spec.node.relative.length ? spec : acc
      , specs[0]).node

      cy.get(inputSelector).type('garbage 🗑', { delay: 0 })
      .get(rowSelector)
      .should('not.exist')

      cy.get(inputSelector).clear().type(longestSpec.fileName)
      cy.get(rowSelector).first().should('contain', longestSpec.relative.replace(`/${longestSpec.fileName}${longestSpec.specFileExtension}`, ''))
      cy.get(rowSelector).last().should('contain', `${longestSpec.fileName}${longestSpec.specFileExtension}`)

      const directory = longestSpec.relative.slice(0, longestSpec.relative.lastIndexOf('/'))

      cy.get(inputSelector).clear().type(directory)
      cy.get(rowSelector).first().should('contain', directory)
    })

    it('should close directories', () => {
      // close all directories
      const directories: string[] = Array.from(new Set(specs.map((spec) => spec.node.relative.split('/')[0]))).sort()

      directories.forEach((dir) => {
        cy.get('[data-cy="row-directory-depth-0"]').contains(dir).click()
      })

      cy.get('[data-cy="spec-item"]').should('not.exist')
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
