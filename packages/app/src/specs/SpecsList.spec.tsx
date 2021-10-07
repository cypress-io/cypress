import SpecsList from './SpecsList.vue'
import { SpecsListFragmentDoc } from '../generated/graphql-test'
import { defaultMessages } from '@cy/i18n'
import type { SpecEdge } from '@packages/frontend-shared/src/generated/test-graphql-types.gen'

const rowSelector = '[data-testid=specs-list-row]'
const inputSelector = 'input'
const fullFile = (s) => `${s.node.fileName}${s.node.specFileExtension}${s.node.fileExtension}`
const hasSpecText = ($node, spec) => {
  expect($node).to.contain(spec.node.fileName)
  expect($node).to.contain(spec.node.fileExtension)
  expect($node).to.contain(spec.node.gitInfo?.author)
  expect($node).to.contain(defaultMessages.file.git.modified)

  return $node
}

let specs: SpecEdge[] = []

describe('<SpecsList />', { keystrokeDelay: 0 }, () => {
  beforeEach(() => {
    cy.mountFragment(SpecsListFragmentDoc, {
      render: (gqlVal) => {
        return <SpecsList gql={gqlVal} />
      },
      type: (ctx) => {
        specs = ctx.stubApp.activeProject?.specs?.edges || []

        return ctx.stubApp
      },
    })
  })

  it('renders specs', () => {
    cy.get(rowSelector).first()
    .should(($node) => hasSpecText($node, specs[0]))
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
    .url()
    .should('contain', fullFile(specs[0]))
  })
})
