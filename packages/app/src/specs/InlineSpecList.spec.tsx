import { Specs_InlineSpecListFragmentDoc } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  beforeEach(() => {
    cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
      onResult: (ctx) => {
        specs = ctx.activeProject?.specs?.edges || []

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
    cy.get('a').should('exist').and('have.length', specs.length)
  })
})
