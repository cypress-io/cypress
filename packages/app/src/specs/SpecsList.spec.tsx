import SpecsList from './SpecsList.vue'
import { Specs_SpecsListFragmentDoc, SpecNode_SpecsListFragment, TestingTypeEnum } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'

const rowSelector = '[data-testid=specs-list-row]'
const inputSelector = 'input'
const fullFile = (s) => `${s.node.fileName}${s.node.specFileExtension}`
const hasSpecText = (_node: JQuery<HTMLElement>, spec: SpecNode_SpecsListFragment) => {
  const $node = _node as JQuery<HTMLDivElement>

  expect($node).to.contain(spec.node.fileName)
  expect($node).to.contain(spec.node.fileExtension)
  expect($node).to.contain(spec.node.gitInfo?.author)
  expect($node).to.contain(defaultMessages.file.git.modified)

  return $node
}

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

    it('renders specs', () => {
      cy.get(rowSelector).first()
      .should(($node) => hasSpecText($node, specs[0]))

      cy.percySnapshot()
    })

    it('filters the specs', () => {
      cy.get(rowSelector).first()
      // Establish a baseline for what the spec rendered is
      .should(($node) => hasSpecText($node, specs[0]))
      .should('be.visible')

      // Cause an empty spec state
      .get(inputSelector).type('garbage 🗑', { delay: 0 })
      .get(rowSelector)
      .should('not.exist')

      // Clear the input, make sure that the right spec is showing up
      .get(inputSelector)
      .type('{selectall}{backspace}', { delay: 0 })

      // Check the spec and its values
      .get(rowSelector).first()
      .should('be.visible')
      .should(($node) => hasSpecText($node, specs[0]))
      .get(inputSelector)
      .type(fullFile(specs[0]), { delay: 0 })
      .get(rowSelector).first()
      .should('contain.text', specs[0].node.fileName)
      .and('contain.text', specs[0].node.fileExtension)
      .click()
    })

    it('changes to tree view', () => {
      cy.get('[data-cy="file-tree-radio-option"]').click()

      // close all directories
      ;['src', 'packages', 'frontend', '__test__', 'lib', 'tests'].forEach((dir) => {
        cy.get('[data-cy="row-directory-depth-0"]').contains(dir).click()
      })

      // all directories closed; no specs should be showing.
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
