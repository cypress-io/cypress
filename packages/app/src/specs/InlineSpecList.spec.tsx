import { Specs_InlineSpecListFragmentDoc } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'
import { defaultMessages } from '@cy/i18n'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  beforeEach(() => {
    cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs)
    cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
      onResult: (ctx) => {
        if (!ctx.currentProject?.specs) {
          return ctx
        }

        ctx.currentProject.specs.edges = specs.map((spec) => ({ __typename: 'SpecEdge', node: { __typename: 'Spec', ...spec, id: spec.relative } }))
        specs = ctx.currentProject?.specs?.edges || []

        return ctx
      },
      render: (gqlValue) => {
        return (
          <div class="bg-gray-1000">
            <InlineSpecList gql={gqlValue}></InlineSpecList>
          </div>
        )
      },
    })
  })

  it('should render a list of spec', () => {
    cy.get('li')
    .should('exist')
    .and('have.length', 7)
  })

  it('should support fuzzy sort', () => {
    cy.get('input').type('scomeA')

    cy.get('li').should('have.length', 2)
    .should('contain', 'src/components')
    .and('contain', 'Spec-A.spec.tsx')
  })

  it('should open CreateSpec modal', () => {
    const newSpecSelector = `[aria-label="New Spec"]`

    cy.get(newSpecSelector).click()
    cy.contains(defaultMessages.createSpec.newSpecModalTitle).should('be.visible')
  })
})
