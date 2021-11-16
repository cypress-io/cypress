import { Specs_InlineSpecListFragmentDoc } from '../generated/graphql-test'
import InlineSpecList from './InlineSpecList.vue'

let specs: Array<any> = []

describe('InlineSpecList', () => {
  beforeEach(() => {
    cy.mountFragment(Specs_InlineSpecListFragmentDoc, {
      onResult: (ctx) => {
        specs = ctx.specs?.edges || []

        return ctx
      },
      render: (gqlValue) => {
        return (
          <div >
            <div id="unified-runner-vue-wrapper">
              <div id="focus-tests-vue-teleport-target"></div>
            </div>
            <div class="bg-gray-1000">
              <InlineSpecList gql={gqlValue}></InlineSpecList>
            </div>
          </div>
        )
      },
    })
  })

  it('should render a list of specs', () => {
    cy.get('a').should('exist').and('have.length', specs.length)
  })

  it('can be opened/closed with an external button if teleport target exists', () => {
    // selecting with an ID as this is what associates the button with what it controls
    const specListSelector = '[id=inline-spec-list-aria-id]'

    cy.get(specListSelector).should('be.visible')
    cy.contains('button', 'Specs').click()
    cy.get(specListSelector).should('not.exist')
    cy.contains('button', 'Specs').click()
    cy.get(specListSelector).should('be.visible')
  })
})
