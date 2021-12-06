import { Specs_InlineSpecListFragmentDoc } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'
import { defaultMessages } from '@cy/i18n'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  beforeEach(() => {
    cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs)
    cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
      onResult: (ctx) => {
        if (!ctx.specs) {
          return ctx
        }

        ctx.specs.edges = specs.map((spec) => ({ __typename: 'SpecEdge', node: { __typename: 'Spec', ...spec, id: spec.relative } }))
        specs = ctx.specs?.edges || []

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
    cy.findAllByTestId('spec-row-item').should('exist').and('have.length', 7)
  })

  it('should support fuzzy sort', () => {
    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder).type('scomeA', { force: true })

    cy.findAllByTestId('spec-row-item').should('have.length', 2).should('contain', 'src/components').and('contain', 'Spec-A.spec.tsx')
  })
})
